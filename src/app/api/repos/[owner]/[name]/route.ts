import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getRepository, getRepositoryLanguages } from '@/lib/github';
import { safeGetCache, safeSetCache } from '@/lib/redis';
import { CACHE_TTL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  // Promise 언래핑 처리는 Next 15 App router 동적 파라미터 컨벤션
  const resolvedParams = await params; 
  const { owner, name } = resolvedParams;
  const fullName = `${owner}/${name}`;
  const cacheKey = `repo_detail:${fullName}`;

  try {
    // 1. 디테일 캐시 체크
    const cached = await safeGetCache<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // 2. DB 조회
    let dbRepo = await prisma.repository.findUnique({
      where: { fullName }
    });

    // 3. 없으면 원본 저장 (동적 온디맨드 수집)
    if (!dbRepo) {
      const ghRepo = await getRepository(owner, name);
      if (!ghRepo || ghRepo.message === 'Not Found') {
         return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
      }

      dbRepo = await prisma.repository.create({
        data: {
          githubId: ghRepo.id,
          fullName: ghRepo.full_name,
          name: ghRepo.name,
          ownerLogin: ghRepo.owner.login,
          ownerAvatarUrl: ghRepo.owner.avatar_url,
          description: ghRepo.description,
          htmlUrl: ghRepo.html_url,
          homepage: ghRepo.homepage,
          language: ghRepo.language,
          topics: ghRepo.topics || [],
          starsCount: ghRepo.stargazers_count,
          forksCount: ghRepo.forks_count,
          issuesCount: ghRepo.open_issues_count,
        }
      });
    }

    // 4. 언어 비율(Byte) 가져오기
    const langBytes = await getRepositoryLanguages(owner, name);
    let totalBytes = 0;
    const languages = [];
    
    for (const [lang, bytes] of Object.entries((langBytes as Record<string, number>))) {
      totalBytes += bytes;
      languages.push({ name: lang, size: bytes });
    }
    
    // 퍼센트 계산
    const enrichedLanguages = languages.map(l => ({
      ...l,
      percentage: totalBytes > 0 ? Math.round((l.size / totalBytes) * 100) : 0
    })).sort((a, b) => b.size - a.size); // 큰 용량부터

    // 빅인트를 넘기면 직렬화 오류가 발생하므로 변환 처리
    const responseData = {
      ...dbRepo,
      id: Number(dbRepo.id),
      githubId: Number(dbRepo.githubId),
      language_stats: enrichedLanguages
    };

    // 5. 반환 및 캐싱
    await safeSetCache(cacheKey, responseData, CACHE_TTL.DAILY);

    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    console.error('[Repo Detail Fetch Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
