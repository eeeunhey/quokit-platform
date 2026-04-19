import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getKoreanReadme } from '@/lib/translator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const resolvedParams = await params;
  const { owner, name } = resolvedParams;
  const fullName = `${owner}/${name}`;

  try {
    // 저장소 식별자 획득
    const repo = await prisma.repository.findUnique({
      where: { fullName },
      select: { id: true }
    });

    if (!repo) {
      return NextResponse.json({ success: false, error: 'Repository needs to be fetched first.' }, { status: 404 });
    }

    // 우리의 코어 라이브러리인 translator 모듈 호출! 알아서 캐싱 & 번역해 줍니다.
    const { data: readmeKo, source } = await getKoreanReadme(repo.id, owner, name);

    return NextResponse.json({
      success: true,
      data: {
        readme_ko: readmeKo,
        source: source,
        status: readmeKo ? 'completed' : 'fallback_original'
      }
    });

  } catch (error: any) {
    console.error('[Readme KO API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
