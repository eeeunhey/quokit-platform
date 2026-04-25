import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeGetCache, safeSetCache } from '@/lib/redis';
import { CACHE_TTL } from '@/lib/constants';
import { fetchTrendingRepositories } from '@/lib/github';
import { scrapeTrendingRepos } from '@/lib/github-trending';
import { translateDescription } from '@/lib/gemini';
import { TrendingPeriod, ProgrammingLanguage, TrendingRepository } from '@/types';

export const maxDuration = 60;

/**
 * Trending API — 두 가지 데이터 소스를 지원합니다.
 * 
 * source=hot    → GitHub Trending 스크래핑 기반 (🔥 Hot: 기존 레포 중 스타 급상승)
 * source=rising → GitHub Search API 기반 (✨ Rising: 최근 신생 레포)
 * 
 * 기본값: source=hot (가장 사용자가 기대하는 데이터)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source') || 'rising';  // 'rising' | 'hot'
  const period = (searchParams.get('period') || 'daily') as TrendingPeriod;
  const language = (searchParams.get('language') || 'all') as ProgrammingLanguage;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '20', 10);

  const nocache = searchParams.get('nocache') === '1';

  const cacheKey = `trending:${source}:${period}:${language}:${page}:${perPage}`;

  try {
    // 1. Redis 캐시 계층 응답 (nocache=1이면 캐시 스킵 + 기존 캐시 삭제)
    if (nocache) {
      const { redis } = await import('@/lib/redis');
      if (redis) {
        try { await redis.del(cacheKey); } catch {}
      }
    }

    const cachedData = nocache ? null : await safeGetCache<TrendingRepository[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        meta: { source, page, per_page: perPage, is_cached: true },
      });
    }

    let results: TrendingRepository[] = [];

    if (source === 'hot') {
      results = await fetchHotData(period, language, page, perPage);
    } else {
      results = await fetchRisingData(period, language, page, perPage);
    }

    // 실시간 번역 (description_ko가 없는 항목만)
    const needsTranslation = results.filter(r => !r.description_ko && r.description);
    if (needsTranslation.length > 0) {
      const BATCH_SIZE = 5;
      for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
        const batch = needsTranslation.slice(i, i + BATCH_SIZE);
        const translations = await Promise.allSettled(
          batch.map(r => translateDescription(r.description!))
        );
        
        translations.forEach((result, idx) => {
          const repo = batch[idx];
          if (result.status === 'fulfilled' && result.value) {
            repo.description_ko = result.value;
            
            if (repo.id > 0) {
              prisma.repository.update({
                where: { id: BigInt(repo.id) },
                data: { descriptionKo: result.value }
              }).catch(() => {}); // fire-and-forget
            }
          }
        });
      }
    }

    // Redis 캐시 저장
    if (results.length > 0) {
      const ttl = period === 'daily' ? CACHE_TTL.DAILY : CACHE_TTL.WEEKLY;
      await safeSetCache(cacheKey, results, ttl);
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: { source, page, per_page: perPage, is_cached: false },
    });

  } catch (error: any) {
    console.error('[Trending API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 🔥 Hot: GitHub Trending 스크래핑 기반 데이터
 * DB에 크론잡으로 저장된 'hot-daily' 등의 스냅샷을 조회합니다.
 * DB에 없으면 실시간 스크래핑 fallback을 실행합니다.
 */
async function fetchHotData(
  period: TrendingPeriod,
  language: ProgrammingLanguage,
  page: number,
  perPage: number
): Promise<TrendingRepository[]> {
  const snapshotPeriod = `hot-${period}`;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshots = await prisma.trendingSnapshot.findMany({
    where: {
      period: snapshotPeriod,
      language: 'all',
      snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) },
    },
    include: { repository: true },
    orderBy: [
      { snapshotDate: 'desc' },
      { gainedStars: 'desc' },
    ],
    skip: (page - 1) * perPage,
    take: perPage,
  });

  if (snapshots.length > 0) {
    // snapshotDate는 각 레포마다 밀리초 단위로 다르므로, 날짜(YYYY-MM-DD) 기준으로 비교
    const latestDateStr = snapshots[0].snapshotDate.toISOString().slice(0, 10);
    const validSnapshots = snapshots.filter(s => s.snapshotDate.toISOString().slice(0, 10) === latestDateStr);
    
    // 같은 repoId가 중복될 수 있으므로 최신 스냅샷만 유지
    const seenRepoIds = new Set<string>();
    const deduped = validSnapshots.filter(s => {
      const key = String(s.repoId);
      if (seenRepoIds.has(key)) return false;
      seenRepoIds.add(key);
      return true;
    });

    // language 필터 적용 (DB에는 'all'로 저장, 프론트에서 필터링)
    let filtered = deduped;
    if (language !== 'all') {
      filtered = deduped.filter(s => 
        s.repository.language?.toLowerCase() === language.toLowerCase()
      );
    }

    return filtered.map(s => ({
      id: Number(s.repository.id),
      github_id: Number(s.repository.githubId),
      full_name: s.repository.fullName,
      name: s.repository.name,
      owner_login: s.repository.ownerLogin,
      owner_avatar_url: s.repository.ownerAvatarUrl || '',
      description: s.repository.description,
      description_ko: s.repository.descriptionKo,
      summary_ko: s.repository.summaryKo,
      html_url: s.repository.htmlUrl,
      homepage: s.repository.homepage,
      language: s.repository.language,
      topics: s.repository.topics as string[],
      stars_count: s.repository.starsCount,
      forks_count: s.repository.forksCount,
      issues_count: s.repository.issuesCount,
      open_graph_image_url: s.repository.openGraphImageUrl,
      created_at: s.repository.createdAt.toISOString(),
      last_fetched_at: s.repository.lastFetchedAt.toISOString(),
      rank: s.currentRank,
      gained_stars: s.gainedStars,
    }));
  }

  // Fallback: DB에 없으면 실시간 스크래핑
  console.log(`[Trending API] Hot fallback: 실시간 스크래핑 (${period})`);
  const scraped = await scrapeTrendingRepos(period, language !== 'all' ? language : undefined);
  const sliced = scraped.slice((page - 1) * perPage, page * perPage);

  return sliced.map((item, idx) => ({
    id: 0,
    github_id: 0,
    full_name: item.fullName,
    name: item.name,
    owner_login: item.owner,
    owner_avatar_url: `https://github.com/${item.owner}.png`,
    description: item.description,
    description_ko: null,
    summary_ko: null,
    html_url: `https://github.com/${item.fullName}`,
    homepage: null,
    language: item.language,
    topics: [],
    stars_count: item.totalStars,
    forks_count: item.totalForks,
    issues_count: 0,
    open_graph_image_url: null,
    created_at: new Date().toISOString(),
    last_fetched_at: new Date().toISOString(),
    rank: (page - 1) * perPage + idx + 1,
    gained_stars: item.gainedStars,
  }));
}

/**
 * ✨ Rising: GitHub Search API 기반 데이터 (기존 로직)
 * 최근 생성된 레포 중 스타가 많은 순서로 반환합니다.
 */
async function fetchRisingData(
  period: TrendingPeriod,
  language: ProgrammingLanguage,
  page: number,
  perPage: number
): Promise<TrendingRepository[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshots = await prisma.trendingSnapshot.findMany({
    where: {
      period: period,
      language: language,
      snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) },
    },
    include: { repository: true },
    orderBy: [
      { snapshotDate: 'desc' },
      { repository: { starsCount: 'desc' } },
    ],
    skip: (page - 1) * perPage,
    take: perPage,
  });

  if (snapshots.length > 0) {
    // snapshotDate는 각 레포마다 밀리초 단위로 다르므로, 날짜(YYYY-MM-DD) 기준으로 비교
    const latestDateStr = snapshots[0].snapshotDate.toISOString().slice(0, 10);
    const validSnapshots = snapshots.filter(s => s.snapshotDate.toISOString().slice(0, 10) === latestDateStr);

    // 같은 repoId가 중복될 수 있으므로 최신 스냅샷만 유지
    const seenRepoIds = new Set<string>();
    const deduped = validSnapshots.filter(s => {
      const key = String(s.repoId);
      if (seenRepoIds.has(key)) return false;
      seenRepoIds.add(key);
      return true;
    });

    return deduped.map(s => ({
      id: Number(s.repository.id),
      github_id: Number(s.repository.githubId),
      full_name: s.repository.fullName,
      name: s.repository.name,
      owner_login: s.repository.ownerLogin,
      owner_avatar_url: s.repository.ownerAvatarUrl || '',
      description: s.repository.description,
      description_ko: s.repository.descriptionKo,
      summary_ko: s.repository.summaryKo,
      html_url: s.repository.htmlUrl,
      homepage: s.repository.homepage,
      language: s.repository.language,
      topics: s.repository.topics as string[],
      stars_count: s.repository.starsCount,
      forks_count: s.repository.forksCount,
      issues_count: s.repository.issuesCount,
      open_graph_image_url: s.repository.openGraphImageUrl,
      created_at: s.repository.createdAt.toISOString(),
      last_fetched_at: s.repository.lastFetchedAt.toISOString(),
      rank: s.currentRank,
      gained_stars: s.gainedStars,
    }));
  }

  // Fallback: GitHub Search API 직접 호출
  const fallbackItems = await fetchTrendingRepositories(period, language);
  const sliced = fallbackItems.slice((page - 1) * perPage, page * perPage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sliced.map((item: any, idx: number) => ({
    id: 0, github_id: item.id, full_name: item.full_name, name: item.name,
    owner_login: item.owner.login, owner_avatar_url: item.owner.avatar_url,
    description: item.description, description_ko: null, summary_ko: null,
    html_url: item.html_url, homepage: item.homepage, language: item.language,
    topics: item.topics || [], stars_count: item.stargazers_count,
    forks_count: item.forks_count, issues_count: item.open_issues_count,
    open_graph_image_url: null, created_at: item.created_at, last_fetched_at: new Date().toISOString(),
    rank: (page - 1) * perPage + idx + 1, gained_stars: 0,
  }));
}
