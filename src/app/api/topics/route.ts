import { NextRequest, NextResponse } from 'next/server';
import { safeGetCache, safeSetCache } from '@/lib/redis';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * 기간별 캐시 TTL (초)
 * - weekly: 6시간 (빠르게 변하는 트렌드)
 * - monthly: 12시간
 * - yearly: 24시간 (안정적)
 */
const PERIOD_CONFIG = {
  weekly: { days: 7, ttl: 21600, label: '1 WEEK' },
  monthly: { days: 30, ttl: 43200, label: '1 MONTH' },
  yearly: { days: 365, ttl: 86400, label: '1 YEAR' },
} as const;

type TopicPeriod = keyof typeof PERIOD_CONFIG;

/**
 * 인메모리 캐시 — Redis 호출조차 생략하여 cold start/첫 방문 시 latency 제거
 * Vercel serverless 환경에서도 동일 instance 내에서는 캐시가 유지됩니다.
 */
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setMemoryCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

interface TopicResult {
  rank: number;
  name: string;
  count: number;        // 등장 레포 개수
  totalStars: number;   // 해당 토픽 레포들의 stargazers_count 합계
}

/**
 * GET /api/topics?period=weekly|monthly|yearly
 *
 * GitHub Search API를 통해 특정 기간 내 Stars 상위 100개 레포의
 * topics(태그)를 집계하여 상위 10개를 반환합니다.
 *
 * 각 토픽에 대해:
 *   - count: 해당 토픽이 나타난 레포 수
 *   - totalStars: 해당 토픽을 가진 레포들의 stargazers_count 합계
 *
 * 캐시 전략 (3-tier):
 *   1. 인메모리 캐시 (즉시 반환, ~0ms)
 *   2. Redis 캐시 (Upstash, ~20-50ms)
 *   3. GitHub Search API fallback (~500-2000ms)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || 'yearly';
    const period: TopicPeriod = (periodParam in PERIOD_CONFIG)
      ? periodParam as TopicPeriod
      : 'yearly';

    const config = PERIOD_CONFIG[period];
    const cacheKey = `global-trending-topics:${period}`;

    // ─── Tier 1: 인메모리 캐시 ───
    const memoryCached = getMemoryCache<TopicResult[]>(cacheKey);
    if (memoryCached) {
      return NextResponse.json({
        success: true,
        data: memoryCached,
        meta: { period, cache_tier: 'memory', ttl: config.ttl },
      });
    }

    // ─── Tier 2: Redis 캐시 ───
    const redisCached = await safeGetCache<TopicResult[]>(cacheKey);
    if (redisCached) {
      // Redis에서 꺼낸 데이터를 인메모리에도 저장 (다음 요청부터 즉시 반환)
      setMemoryCache(cacheKey, redisCached, Math.min(config.ttl, 3600)); // 메모리는 최대 1시간
      return NextResponse.json({
        success: true,
        data: redisCached,
        meta: { period, cache_tier: 'redis', ttl: config.ttl },
      });
    }

    // ─── Tier 3: GitHub Search API ───
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - config.days);
    const dateString = dateFrom.toISOString().split('T')[0];

    const query = `created:>${dateString} stars:>100`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`;

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers, next: { revalidate: config.ttl } });

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

    // ─── 토픽 집계: count + totalStars ───
    const topicData: Record<string, { count: number; totalStars: number }> = {};

    items.forEach((repo) => {
      const topics: string[] = repo.topics || [];
      const stars: number = repo.stargazers_count || 0;

      topics.forEach((t: string) => {
        const normalized = t.trim().toLowerCase();
        if (normalized) {
          if (!topicData[normalized]) {
            topicData[normalized] = { count: 0, totalStars: 0 };
          }
          topicData[normalized].count += 1;
          topicData[normalized].totalStars += stars;
        }
      });
    });

    // ─── 빈도순 상위 10개 ───
    const topTags: TopicResult[] = Object.entries(topicData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data], index) => ({
        rank: index + 1,
        name,
        count: data.count,
        totalStars: data.totalStars,
      }));

    // ─── 캐시 저장 (Redis + Memory) ───
    if (topTags.length > 0) {
      await safeSetCache(cacheKey, topTags, config.ttl);
      setMemoryCache(cacheKey, topTags, Math.min(config.ttl, 3600));
    }

    return NextResponse.json({
      success: true,
      data: topTags,
      meta: {
        period,
        cache_tier: 'origin',
        ttl: config.ttl,
        total_repos_analyzed: items.length,
        total_unique_topics: Object.keys(topicData).length,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Topics API Error]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
