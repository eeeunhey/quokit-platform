import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeGetCache, safeSetCache } from '@/lib/redis';
import { CACHE_TTL } from '@/lib/constants';
import { fetchTrendingRepositories } from '@/lib/github';
import { translateDescription } from '@/lib/gemini';
import { TrendingPeriod, ProgrammingLanguage, TrendingRepository } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get('period') || 'daily') as TrendingPeriod;
  const language = (searchParams.get('language') || 'all') as ProgrammingLanguage;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '20', 10);

  const cacheKey = `trending:${period}:${language}:${page}:${perPage}`;

  try {
    // 1. Redis 캐시 계층 응답
    const cachedData = await safeGetCache<TrendingRepository[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        meta: { page, per_page: perPage, is_cached: true },
      });
    }

    // 2. Database 계층 응답 (가장 최근 스냅샷 날짜 기준)
    const today = new Date();
    today.setHours(0,0,0,0);

    const snapshots = await prisma.trendingSnapshot.findMany({
      where: {
        period: period,
        language: language,
        // 최근 이틀 이내의 데이터만 취급 (크론잡 중단 등 예외상황 방어)
        snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) }
      },
      include: { repository: true },
      orderBy: [
        { snapshotDate: 'desc' }, 
        { repository: { starsCount: 'desc' } }
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });

    let results: TrendingRepository[] = [];

    // DB에 데이터가 존재할 경우 매핑
    if (snapshots.length > 0) {
      // 가장 최신 날짜의 데이터만 잘라내기 로직 처리
      const latestDate = snapshots[0].snapshotDate.toISOString();
      const validSnapshots = snapshots.filter(s => s.snapshotDate.toISOString() === latestDate);

      results = validSnapshots.map(s => ({
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
        
        // TrendingSnapshot 전용 필드
        rank: s.currentRank,
        gained_stars: s.gainedStars,
      }));
    } else {
      // 3. Fallback: 레디스도, DB도 모두 없을 땐 GitHub API 직접 치고 캐시에 임시 보관
      const fallbackItems = await fetchTrendingRepositories(period, language);
      const sliced = fallbackItems.slice((page - 1) * perPage, page * perPage);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results = sliced.map((item: any, idx: number) => ({
        id: 0, github_id: item.id, full_name: item.full_name, name: item.name,
        owner_login: item.owner.login, owner_avatar_url: item.owner.avatar_url,
        description: item.description, description_ko: null, summary_ko: null,
        html_url: item.html_url, homepage: item.homepage, language: item.language,
        topics: item.topics || [], stars_count: item.stargazers_count,
        forks_count: item.forks_count, issues_count: item.open_issues_count,
        open_graph_image_url: null, created_at: item.created_at, last_fetched_at: new Date().toISOString(),
        rank: (page - 1) * perPage + idx + 1, gained_stars: 0
      }));
    }

    // 4. 메인 카드 description 실시간 번역 (description_ko가 없는 항목만)
    //    비동기 병렬 처리: 최대 5개씩 동시에 번역하여 속도를 높인다.
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
            
            // DB에 비동기로 저장 (응답 속도에 영향 없음)
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

    // 5. 안전하게 레디스에 저장 후 반환
    if (results.length > 0) {
      const ttl = period === 'daily' ? CACHE_TTL.DAILY : CACHE_TTL.WEEKLY;
      await safeSetCache(cacheKey, results, ttl);
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: { page, per_page: perPage, is_cached: false },
    });

  } catch (error: any) {
    console.error('[Trending API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
