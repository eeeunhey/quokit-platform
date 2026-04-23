import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const maxDuration = 60;

/**
 * DB 클린업 크론잡 / 수동 실행
 * 
 * GET /api/cron/cleanup
 * Authorization: Bearer <CRON_SECRET>
 * 
 * 정리 대상:
 * 1. trending_snapshots: 30일 이상 된 스냅샷 삭제
 * 2. translation_cache: 60일 이상 접근 안 된 번역 삭제
 * 3. api_usage_log: 90일 이상 된 로그 삭제
 * 4. repositories: 스냅샷이 하나도 없는 고아 레포 삭제 (선택적)
 * 
 * 사용자 영향:
 * - 사용자는 항상 최근 30일 데이터를 볼 수 있음
 * - 오래된 데이터는 더 이상 표시되지 않으므로 삭제해도 무방
 * - 번역은 크론잡이 다시 생성 가능
 */

// 보안 크론 시크릿 검증 (CRON_SECRET 또는 ADMIN_SECRET 둘 다 허용)
function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return (
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    authHeader === `Bearer ${process.env.ADMIN_SECRET}`
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const results = {
    snapshots: { deleted: 0, cutoff: '' },
    translations: { deleted: 0, cutoff: '' },
    logs: { deleted: 0, cutoff: '' },
    orphanRepos: { deleted: 0 },
  };

  try {
    // ──────── 1. 30일 이상 된 스냅샷 삭제 ────────
    const snapshotCutoff = new Date();
    snapshotCutoff.setDate(snapshotCutoff.getDate() - 30);
    results.snapshots.cutoff = snapshotCutoff.toISOString();

    const deletedSnapshots = await prisma.trendingSnapshot.deleteMany({
      where: { snapshotDate: { lt: snapshotCutoff } },
    });
    results.snapshots.deleted = deletedSnapshots.count;

    // ──────── 2. 60일 이상 된 번역 캐시 삭제 ────────
    const translationCutoff = new Date();
    translationCutoff.setDate(translationCutoff.getDate() - 60);
    results.translations.cutoff = translationCutoff.toISOString();

    const deletedTranslations = await prisma.translationCache.deleteMany({
      where: { updatedAt: { lt: translationCutoff } },
    });
    results.translations.deleted = deletedTranslations.count;

    // ──────── 3. 90일 이상 된 API 사용 로그 삭제 ────────
    const logCutoff = new Date();
    logCutoff.setDate(logCutoff.getDate() - 90);
    results.logs.cutoff = logCutoff.toISOString();

    const deletedLogs = await prisma.apiUsageLog.deleteMany({
      where: { logDate: { lt: logCutoff } },
    });
    results.logs.deleted = deletedLogs.count;

    // ──────── 4. 고아 레포 삭제 (스냅샷이 0개인 레포) ────────
    // 최근 7일 내에 생성된 레포는 제외 (크론잡이 아직 처리 안 했을 수 있음)
    const orphanCutoff = new Date();
    orphanCutoff.setDate(orphanCutoff.getDate() - 7);

    const orphanRepos = await prisma.repository.findMany({
      where: {
        createdAt: { lt: orphanCutoff },
        trendingSnapshots: { none: {} },
        translationCache: null,
      },
      select: { id: true },
    });

    if (orphanRepos.length > 0) {
      const deletedOrphans = await prisma.repository.deleteMany({
        where: {
          id: { in: orphanRepos.map(r => r.id) },
        },
      });
      results.orphanRepos.deleted = deletedOrphans.count;
    }

    // ──────── 5. 클린업 로그 기록 ────────
    const totalDeleted =
      results.snapshots.deleted +
      results.translations.deleted +
      results.logs.deleted +
      results.orphanRepos.deleted;

    await prisma.apiUsageLog.create({
      data: {
        serviceName: 'system',
        endpoint: '/api/cron/cleanup',
        requestsCount: 1,
        tokensUsed: totalDeleted, // "처리된 항목 수"를 tokens 필드에 기록
      },
    });

    console.log(`[Cleanup] ✅ 완료: snapshots=${results.snapshots.deleted}, translations=${results.translations.deleted}, logs=${results.logs.deleted}, orphans=${results.orphanRepos.deleted}`);

    return NextResponse.json({
      success: true,
      totalDeleted,
      details: results,
    });

  } catch (error: any) {
    console.error('[Cleanup Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
