import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '25', 10);
    const limit = Math.min(limitParam, 100); // GitHub API maximum is 100
    const lang = searchParams.get('lang') || 'all';
    const period = searchParams.get('period') || 'daily';

    // 기간 계산 (daily, weekly, monthly)
    const date = new Date();
    if (period === 'daily') date.setDate(date.getDate() - 2);
    else if (period === 'weekly') date.setDate(date.getDate() - 7);
    else if (period === 'monthly') date.setMonth(date.getMonth() - 1);
    else date.setFullYear(date.getFullYear() - 1);

    const ds = date.toISOString().split('T')[0];
    
    let query = `pushed:>${ds}`;
    if (lang !== 'all' && lang !== 'others') {
      query += `+language:${lang}`;
    }

    const GITHUB_API = 'https://api.github.com';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    };

    // 항상 100개를 가져와서 모수(데이터 풀)를 고정해야만 개수를 변경해도 순위가 뒤섞이지 않습니다.
    const url = `${GITHUB_API}/search/repositories?q=${query}&sort=stars&order=desc&per_page=100`;
    
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();

    const devMap: Record<string, any> = {};

    (data.items || []).forEach((repo: any) => {
      const login = repo.owner.login;
      if (!login) return;

      const stars = repo.stargazers_count || 0;

      if (!devMap[login]) {
        devMap[login] = {
          id: login,
          login: login,
          name: login, 
          avatar: repo.owner.avatar_url,
          hits: stars,
          topLang: repo.language || 'Unknown'
        };
      } else {
        // 여러 트렌딩 레포를 가진 개발자라면 스타 수를 누적합니다.
        devMap[login].hits += stars;
      }
    });

    // 획득한 진짜 스타 수 합계를 기준으로 정렬
    const developers = Object.values(devMap).sort((a: any, b: any) => b.hits - a.hits).slice(0, limit);

    return NextResponse.json(developers);
    
  } catch (error) {
    console.error('[API Developers Error]', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}
