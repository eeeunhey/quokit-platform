import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 1. Prisma DB에서 별점 기준 상위 레포지토리 정보 호출 
    //    (GitHub API 과부하 방지를 위해 일차적으로 DB의 트렌딩 캐싱 데이터 활용)
    const repos = await prisma.repository.findMany({
      select: {
        ownerLogin: true,
        ownerAvatarUrl: true,
        starsCount: true,
        language: true,
      },
      orderBy: { starsCount: 'desc' },
      take: 2000, 
    });

    // 2. 개발자(소유자)별로 데이터 집계
    const devMap: Record<string, any> = {};

    repos.forEach(repo => {
      const login = repo.ownerLogin;
      if (!login) return;

      if (!devMap[login]) {
        devMap[login] = {
          id: login,
          login: login,
          name: login, 
          avatar: repo.ownerAvatarUrl || `https://github.com/${login}.png`,
          hits: 0,
          langs: {} as Record<string, number>,
        };
      }
      
      // 해당 개발자의 누적 스타 수를 계산 (Hits 대신 랭킹 지표로 사용)
      devMap[login].hits += repo.starsCount;
      
      if (repo.language) {
        devMap[login].langs[repo.language] = (devMap[login].langs[repo.language] || 0) + 1;
      }
    });

    // 3. 주력 언어 판별 및 최종 정렬
    const developers = Object.values(devMap).map(dev => {
      const sortedLangs = Object.entries(dev.langs).sort((a: any, b: any) => b[1] - a[1]);
      const topLang = sortedLangs.length > 0 ? sortedLangs[0][0] : 'Unknown';
      
      return {
        id: dev.login,
        login: dev.login,
        name: dev.login, // GitHub API 호출 전 기본값
        avatar: dev.avatar,
        bio: 'GitHub 트렌딩 기여자',
        hits: dev.hits,
        topLang
      };
    }).sort((a, b) => b.hits - a.hits).slice(0, limit);

    return NextResponse.json(developers);
    
  } catch (error) {
    console.error('[API Developers Error]', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}
