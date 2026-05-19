import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '25', 10);
    const limit = Math.min(limitParam, 100);
    const lang = searchParams.get('lang') || 'all';
    const period = searchParams.get('period') || 'daily';
    const type = searchParams.get('type') || 'trending'; // 'trending' or 'all-time'

    const devMap: Record<string, any> = {};

    if (type === 'all-time') {
      // ─────────────────────────────────────────────────────────────
      // [기존 방식] GitHub API 기반: 역대 글로벌 누적 스타(Top) 개발자
      // ─────────────────────────────────────────────────────────────
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

      const url = `${GITHUB_API}/search/repositories?q=${query}&sort=stars&order=desc&per_page=100`;
      const res = await fetch(url, { headers, next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

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
            hits: stars, // 여기서는 누적 스타 수
            topLang: repo.language || 'Unknown'
          };
        } else {
          devMap[login].hits += stars;
        }
      });
    } else {
      // ─────────────────────────────────────────────────────────────
      // [신규 방식] DB 스냅샷 기반: 실시간 급상승 트렌딩 개발자
      // ─────────────────────────────────────────────────────────────
      const latestSnapshot = await prisma.trendingSnapshot.findFirst({
        where: {
          period,
          ...(lang !== 'all' && lang !== 'others' ? { language: lang } : {})
        },
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true }
      });

      if (latestSnapshot) {
        const snapshots = await prisma.trendingSnapshot.findMany({
          where: {
            period,
            snapshotDate: latestSnapshot.snapshotDate,
            ...(lang !== 'all' && lang !== 'others' ? { language: lang } : {})
          },
          include: { repository: true }
        });

        snapshots.forEach((snap) => {
          const repo = snap.repository;
          const login = repo.ownerLogin;
          if (!login) return;

          const score = snap.gainedStars > 0 ? snap.gainedStars : 1;

          if (!devMap[login]) {
            devMap[login] = {
              id: login,
              login: login,
              name: login, 
              avatar: repo.ownerAvatarUrl || `https://github.com/${login}.png`,
              hits: score, // 여기서는 최근 얻은 별 개수
              topLang: repo.language || 'Unknown'
            };
          } else {
            devMap[login].hits += score;
          }
        });
      }
    }

    // 3. 트렌딩 점수(hits) 합계 기준으로 내림차순 정렬
    const developers = Object.values(devMap)
      .sort((a: any, b: any) => b.hits - a.hits)
      .slice(0, limit);

    return NextResponse.json(developers);
    
  } catch (error) {
    console.error('[API Developers Error]', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}
