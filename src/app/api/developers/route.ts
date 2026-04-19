import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

    // 실시간 GitHub 인기 레포지토리 검색하여 소유자를 트렌딩 개발자로 표출
    const url = `${GITHUB_API}/search/repositories?q=${query}&sort=stars&order=desc&per_page=${limit}`;
    
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();

    const devMap: Record<string, any> = {};

    (data.items || []).forEach((repo: any) => {
      const login = repo.owner.login;
      if (!login) return;

      if (!devMap[login]) {
        // 결정론적 일수(hits) 계산 함수
        const generateHits = () => {
          let hash = 0;
          for (let i = 0; i < login.length; i++) hash = Math.imul(31, hash) + login.charCodeAt(i) | 0;
          const normalized = Math.abs(hash) / 2147483648; 
          return Math.floor(normalized * 300) + 50; // 50 ~ 350
        };

        devMap[login] = {
          id: login,
          login: login,
          name: login, 
          avatar: repo.owner.avatar_url,
          hits: generateHits(),
          topLang: repo.language || 'Unknown'
        };
      }
    });

    const developers = Object.values(devMap).sort((a: any, b: any) => b.hits - a.hits).slice(0, limit);

    return NextResponse.json(developers);
    
  } catch (error) {
    console.error('[API Developers Error]', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}
