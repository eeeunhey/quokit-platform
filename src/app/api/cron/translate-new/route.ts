import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { translateDescription, summarizeReadme, translateReadme } from '@/lib/gemini';
import { getReadme } from '@/lib/github';

export const maxDuration = 60;

// MyMemory 무료 API: IP 차단 방지를 위해 1.5초 간격으로 호출
const DELAY_MS = 1500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 번역이 필요한 레포 최대 15개씩 처리 (MyMemory는 Gemini보다 빠름)
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
        // 1. Description 번역 (짧으므로 빠름)
        const descKo = repo.description
          ? await translateDescription(repo.description)
          : null;
        await delay(DELAY_MS);

        // 2. README 가져와서 미니 요약 생성
        const originalReadme = await getReadme(repo.ownerLogin, repo.name);
        // 3. 전체 README 번역 및 DB/Cache 저장
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

        let sumKo: string | null = null;
        if (originalReadme) {
          sumKo = await summarizeReadme(originalReadme);
          await delay(DELAY_MS);
        }

        // 3. DB 업데이트
        await prisma.repository.update({
          where: { id: repo.id },
          data: {
            descriptionKo: descKo,
            // summaryKo가 null이면 descriptionKo를 fallback으로 사용
            summaryKo: sumKo ?? descKo,
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
