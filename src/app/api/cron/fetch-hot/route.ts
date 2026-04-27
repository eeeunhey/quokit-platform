import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { scrapeTrendingRepos } from '@/lib/github-trending';

export const maxDuration = 60;

/**
 * 크론잡: GitHub Trending 페이지 스크래핑 → DB 저장
 * 
 * github.com/trending에서 실시간 트렌딩 레포를 수집합니다.
 * 기존 fetch-trending(Search API)과 달리, "기존 인기 레포 중 스타가 급증한" 레포를 잡습니다.
 * 
 * 스냅샷 period 값:
 * - 'hot-daily'   → 오늘 스타 급상승
 * - 'hot-weekly'  → 이번 주 스타 급상승
 * - 'hot-monthly' → 이번 달 스타 급상승
 * 
 * 기존 Search API 기반:
 * - 'daily'   → 오늘 새로 만들어진 레포
 * - 'weekly'  → 이번 주 새로 만들어진 레포
 * - 'monthly' → 이번 달 새로 만들어진 레포
 */

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const periods = ['daily', 'weekly', 'monthly'] as const;
  let totalSaved = 0;

  try {
    // 같은 크론 실행 내 모든 스냅샷은 동일한 날짜를 공유해야 함
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    for (const since of periods) {
      const scraped = await scrapeTrendingRepos(since);
      
      if (scraped.length === 0) {
        console.warn(`[CRON fetch-hot] ${since}: 스크래핑 결과 없음, 스킵`);
        continue;
      }

      const snapshotPeriod = `hot-${since}`;

      for (let i = 0; i < Math.min(scraped.length, 25); i++) {
        const item = scraped[i];
        const rank = i + 1;

        try {
          // GitHub API로 github_id를 모를 수 있으므로 fullName 기준 upsert
          const repository = await prisma.repository.upsert({
            where: { fullName: item.fullName },
            create: {
              githubId: -(Date.now() + i + Math.floor(Math.random() * 1000000)), // 고유 제약조건을 피하기 위한 임시 음수 ID
              fullName: item.fullName,
              name: item.name,
              ownerLogin: item.owner,
              ownerAvatarUrl: `https://github.com/${item.owner}.png`,
              description: item.description || null,
              htmlUrl: `https://github.com/${item.fullName}`,
              language: item.language,
              topics: [],
              starsCount: item.totalStars,
              forksCount: item.totalForks,
            },
            update: {
              starsCount: item.totalStars,
              forksCount: item.totalForks,
              lastFetchedAt: new Date(),
              // description이 있으면 갱신 (빈 값으로 덮어쓰지 않음)
              ...(item.description ? { description: item.description } : {}),
              ...(item.language ? { language: item.language } : {}),
            },
          });

          // TrendingSnapshot 쓰기
          try {
            await prisma.trendingSnapshot.create({
              data: {
                period: snapshotPeriod,
                language: 'all',
                repoId: repository.id,
                currentRank: rank,
                gainedStars: item.gainedStars,
                snapshotDate,
              },
            });
            totalSaved++;
          } catch {
            // 이미 오늘 날짜의 스냅샷이 있으면 무시
          }
        } catch (repoErr) {
          console.error(`[CRON fetch-hot] ${item.fullName} 저장 실패:`, repoErr);
        }
      }
    }

    // 사용량 로깅 — logDate를 날짜 단위로 통일 (밀리초 차이로 upsert 실패 방지)
    const logDate = new Date();
    logDate.setHours(0, 0, 0, 0);

    await prisma.apiUsageLog.upsert({
      where: {
        serviceName_endpoint_logDate: {
          serviceName: 'github-scrape',
          endpoint: '/trending',
          logDate,
        },
      },
      update: { requestsCount: { increment: 3 } },
      create: { serviceName: 'github-scrape', endpoint: '/trending', requestsCount: 3, logDate },
    });

    console.log(`[CRON fetch-hot] ✅ 완료: ${totalSaved}개 스냅샷 저장`);

    return NextResponse.json({ success: true, saved_snapshots: totalSaved });

  } catch (error: any) {
    console.error('[CRON fetch-hot Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
