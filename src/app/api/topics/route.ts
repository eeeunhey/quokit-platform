import { NextResponse } from 'next/server';
import { safeGetCache, safeSetCache } from '@/lib/redis';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_KEY = 'global-trending-topics:1year';
const CACHE_TTL = 86400; // 24시간 — 하루에 한 번만 GitHub API를 호출합니다.

/**
 * GitHub Search API를 통해 최근 1년간 가장 많은 Stars를 받은 레포지토리 100개의
 * 토픽(tags)을 집계하여 상위 15개를 반환합니다.
 *
 * 데이터 흐름:
 *   1. Redis 캐시에 데이터가 있으면 즉시 반환 (API 비용 0)
 *   2. 캐시 미스 시 GitHub Search API 호출 → 토픽 집계 → 캐시 저장 → 반환
 *
 * GitHub Search API는 한 번에 최대 100건을 반환하며, 이를 통해 Per-page 100개의
 * 실제 트렌딩 레포지토리에서 가장 많이 사용된 태그를 추출합니다.
 */
export async function GET() {
  try {
    // 1) Redis 캐시 확인
    const cached = await safeGetCache<{ rank: number; name: string; count: number }[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { is_cached: true, ttl: CACHE_TTL },
      });
    }

    // 2) GitHub Search API: 최근 1년간 생성된 레포 중 Stars 기준 상위 100개
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateString = oneYearAgo.toISOString().split('T')[0];

    const query = `created:>${dateString} stars:>100`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`;

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers, next: { revalidate: CACHE_TTL } });

    if (!response.ok) {
      console.error(`[Topics API] GitHub responded ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `GitHub API Error: ${response.status}` },
        { status: 502 }
      );
    }

    const json = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = json.items || [];

    // 3) 모든 레포의 topics를 집계
    const topicCounts: Record<string, number> = {};
    items.forEach((repo) => {
      const topics: string[] = repo.topics || [];
      topics.forEach((t: string) => {
        const normalized = t.trim().toLowerCase();
        if (normalized) {
          topicCounts[normalized] = (topicCounts[normalized] || 0) + 1;
        }
      });
    });

    // 4) 빈도순 상위 15개 태그 추출
    const topTags = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count], index) => ({
        rank: index + 1,
        name,
        count,
      }));

    // 5) Redis 캐시 저장 (24시간)
    if (topTags.length > 0) {
      await safeSetCache(CACHE_KEY, topTags, CACHE_TTL);
    }

    return NextResponse.json({
      success: true,
      data: topTags,
      meta: {
        is_cached: false,
        ttl: CACHE_TTL,
        total_repos_analyzed: items.length,
        total_unique_topics: Object.keys(topicCounts).length,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Topics API Error]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
