import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeGetCache, safeSetCache } from '@/lib/redis';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q || q.trim() === '') {
    return NextResponse.json({ success: false, data: [] });
  }

  const cacheKey = `search_repo:${encodeURIComponent(q)}`;

  try {
    const cached = await safeGetCache(cacheKey) as { repos: any[], developers: any[] } | null;
    if (cached) return NextResponse.json({ success: true, data: cached.repos, developers: cached.developers });

    // ─── 1. 내부 DB에서 레포 + 개발자(ownerLogin) 검색 ───
    const localMatches = await prisma.repository.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { fullName: { contains: q } },
          { ownerLogin: { contains: q } },
          { descriptionKo: { contains: q } },
          { summaryKo: { contains: q } },
        ]
      },
      orderBy: { starsCount: 'desc' },
      take: 15
    });

    // bigint 변환 래핑
    const formattedRepos = localMatches.map(repo => ({
        ...repo,
        id: Number(repo.id),
        githubId: Number(repo.githubId),
        _type: 'repo' as const,
    }));

    // ─── 2. GitHub Users API로 개발자 검색 (DB에 결과 부족 시) ───
    let developers: any[] = [];
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

      const userRes = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=5`,
        { headers, next: { revalidate: 600 } }
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        developers = (userData.items || []).map((user: any) => ({
          _type: 'developer' as const,
          id: user.id,
          login: user.login,
          avatar_url: user.avatar_url,
          html_url: user.html_url,
          type: user.type,
        }));
      }
    } catch {
      // GitHub API 실패 시 무시 — DB 결과만 반환
    }

    const combinedData = { repos: formattedRepos, developers };

    await safeSetCache(cacheKey, combinedData, 600);

    return NextResponse.json({ success: true, data: formattedRepos, developers });

  } catch (error: any) {
    console.error('[Search API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
