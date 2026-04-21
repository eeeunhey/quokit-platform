import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { translateDescription, translateReadme } from '@/lib/gemini';
import { getReadme } from '@/lib/github';

export const maxDuration = 60;

// Bing/Google 무료 API: IP 차단 방지를 위해 1.5초 간격으로 호출
const DELAY_MS = 1500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * 크론잡: 번역되지 않은 레포의 description + README를 Bing/Google로 번역합니다.
 *
 * ⚠️ AI 요약(summary_ko)은 이 크론잡에서 생성하지 않습니다.
 *    → 로컬 스크립트(scripts/daily-summary.ts)에서 Gemini로 별도 실행합니다.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 번역이 필요한 레포 최대 15개씩 처리
    const pendingRepos = await prisma.repository.findMany({
      where: { descriptionKo: null },
      orderBy: { starsCount: 'desc' },
      take: 15,
    });

    if (pendingRepos.length === 0) {
      return NextResponse.json({ success: true, translated: 0, message: '모두 번역 완료!' });
    }

    let successCount = 0;

    for (const repo of pendingRepos) {
      try {
        // 1. Description 번역 (Bing/Google)
        const descKo = repo.description
          ? await translateDescription(repo.description)
          : null;
        await delay(DELAY_MS);

        // 2. README 가져와서 번역 (Bing/Google) → TranslationCache에 저장
        const originalReadme = await getReadme(repo.ownerLogin, repo.name);
        if (originalReadme) {
          const existingTranslation = await prisma.translationCache.findUnique({
            where: { repoId: repo.id }
          });
          
          if (!existingTranslation) {
            const readmeKo = await translateReadme(originalReadme);
            if (readmeKo) {
              await prisma.translationCache.create({
                data: {
                  repoId: repo.id,
                  readmeOriginal: originalReadme,
                  readmeKo: readmeKo,
                  tokensUsed: 0
                }
              });
            }
          }
          await delay(DELAY_MS); 
        }

        // 3. DB 업데이트 (summary_ko는 로컬 스크립트가 별도 처리)
        await prisma.repository.update({
          where: { id: repo.id },
          data: {
            descriptionKo: descKo,
          },
        });

        successCount++;
        console.log(`[Translate] ✅ ${repo.fullName}`);
      } catch (repoErr) {
        console.error(`[Translate] ❌ ${repo.fullName}:`, repoErr);
        // 한 개 실패해도 나머지는 계속 진행
        await delay(DELAY_MS);
      }
    }

    return NextResponse.json({ success: true, translated: successCount });

  } catch (error: any) {
    console.error('[CRON Translate New Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
