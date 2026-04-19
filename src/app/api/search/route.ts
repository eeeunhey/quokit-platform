import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeGetCache, safeSetCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q || q.trim() === '') {
    return NextResponse.json({ success: false, data: [] });
  }

  const cacheKey = `search_repo:${encodeURIComponent(q)}`;

  try {
    const cached = await safeGetCache(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // 내부 DB에서 한글 설명(descriptionKo. summaryKo) 위주로 먼저 쿼리 (가장 최적)
    const localMatches = await prisma.repository.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { fullName: { contains: q } },
          { descriptionKo: { contains: q } },
          { summaryKo: { contains: q } },
        ]
      },
      orderBy: { starsCount: 'desc' },
      take: 15
    });

    // bigint 변환 래핑
    const formattedData = localMatches.map(repo => ({
        ...repo,
        id: Number(repo.id),
        githubId: Number(repo.githubId)
    }));

    await safeSetCache(cacheKey, formattedData, 600); // 검색결과는 자주 바뀔 수 있으므로 10분만 캐싱

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error: any) {
    console.error('[Search API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
