import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchTrendingRepositories } from '@/lib/github';
import { TrendingPeriod, ProgrammingLanguage } from '@/types';

export const maxDuration = 60;

// 보안 크론 시크릿 검증
function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const periods: TrendingPeriod[] = ['daily', 'weekly', 'monthly'];
  const language: ProgrammingLanguage = 'all'; // Phase 1: 전체 언어 단위 기준 메인 수집
  let totalSaved = 0;

  try {
    for (const period of periods) {
      // 1. GitHub API 호출
      const items = await fetchTrendingRepositories(period, language);
      
      // 2. 응답받은 레포지토리 저장/갱신
      for (let i = 0; i < Math.min(items.length, 25); i++) { // 각 기간당 상위 25개만 수집
        const item = items[i];
        const rank = i + 1;

        // Repository Upsert
        const repository = await prisma.repository.upsert({
          where: { githubId: item.id },
          create: {
            githubId: item.id,
            fullName: item.full_name,
            name: item.name,
            ownerLogin: item.owner.login,
            ownerAvatarUrl: item.owner.avatar_url,
            description: item.description,
            htmlUrl: item.html_url,
            homepage: item.homepage,
            language: item.language,
            topics: item.topics || [],
            starsCount: item.stargazers_count,
            forksCount: item.forks_count,
            issuesCount: item.open_issues_count,
          },
          update: {
            // 변경 가능한 메타데이터 갱신
            starsCount: item.stargazers_count,
            forksCount: item.forks_count,
            issuesCount: item.open_issues_count,
            lastFetchedAt: new Date(),
          }
        });

        // TrendingSnapshot 쓰기 (Unique 제약조건 방어 코드)
        try {
          await prisma.trendingSnapshot.create({
            data: {
              period: period,
              language: language,
              repoId: repository.id,
              currentRank: rank,
              snapshotDate: new Date(),
              // (Optional) gainedStars는 상세 로직 필요시 이전 스냅샷과 비교
            }
          });
          totalSaved++;
        } catch (err) {
          // 이미 오늘 날짜의 스냅샷이 있으면 무시 (에러 억제)
        }
      }
    }

    // 3. 사용량 로깅
    await prisma.apiUsageLog.upsert({
      where: {
         serviceName_endpoint_logDate: {
           serviceName: 'github',
           endpoint: '/search/repositories',
           logDate: new Date()
         }
      },
      update: { requestsCount: { increment: 3 } },
      create: { serviceName: 'github', endpoint: '/search/repositories', requestsCount: 3 }
    });

    return NextResponse.json({ success: true, saved_snapshots: totalSaved });

  } catch (error: any) {
    console.error('[CRON Fetch Trending Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
