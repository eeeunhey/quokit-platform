import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { searchSimilar } from '@/lib/similarity';
import { safeGetCache, safeSetCache } from '@/lib/redis';
import { CACHE_TTL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const resolvedParams = await params;
  const { owner, name } = resolvedParams;
  const fullName = `${owner}/${name}`;
  
  const cacheKey = `similar_repo:${fullName}`;

  try {
    const cached = await safeGetCache(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // 타겟 레포지토리 토픽 분석
    const repo = await prisma.repository.findUnique({
      where: { fullName },
      select: { topics: true }
    });

    if (!repo) {
       return NextResponse.json({ success: false, error: 'Repo not found' }, { status: 404 });
    }

    // 코어 라이브러리의 searchSimilar 동작
    const topicsArr = Array.isArray(repo.topics) ? (repo.topics as string[]) : [];
    const similarities = await searchSimilar(topicsArr, fullName);

    // 검색 결과 반환 및 캐싱
    await safeSetCache(cacheKey, similarities, CACHE_TTL.SIMILAR);

    return NextResponse.json({ success: true, data: similarities });

  } catch (error: any) {
    console.error('[Similar Repos API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
