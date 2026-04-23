import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const maxDuration = 30;

/**
 * 관리자 전용: DB 상태 모니터링 API
 * 
 * GET /api/admin/db-stats
 * Authorization: Bearer <ADMIN_SECRET>
 * 
 * 반환:
 * - 각 테이블별 행 수
 * - 데이터 날짜 범위 (가장 오래된 ~ 최신)
 * - translation_cache 용량 추정
 * - 최근 크론잡 실행 기록
 * - 클린업 이력
 */
export async function GET(request: NextRequest) {
  // 인증은 middleware에서 처리됨

  try {
    // ──────── 1. 테이블별 행 수 ────────
    const [
      repoCount,
      snapshotCount,
      translationCount,
      usageLogCount,
    ] = await Promise.all([
      prisma.repository.count(),
      prisma.trendingSnapshot.count(),
      prisma.translationCache.count(),
      prisma.apiUsageLog.count(),
    ]);

    // ──────── 2. 데이터 날짜 범위 ────────
    const [oldestRepo, newestRepo] = await Promise.all([
      prisma.repository.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true, fullName: true } }),
      prisma.repository.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, fullName: true } }),
    ]);

    const [oldestSnapshot, newestSnapshot] = await Promise.all([
      prisma.trendingSnapshot.findFirst({ orderBy: { snapshotDate: 'asc' }, select: { snapshotDate: true } }),
      prisma.trendingSnapshot.findFirst({ orderBy: { snapshotDate: 'desc' }, select: { snapshotDate: true } }),
    ]);

    // ──────── 3. 스냅샷 기간별 분포 ────────
    const snapshotsByPeriod = await prisma.trendingSnapshot.groupBy({
      by: ['period'],
      _count: { id: true },
    });

    // ──────── 4. 번역 상태 ────────
    const untranslatedCount = await prisma.repository.count({
      where: { descriptionKo: null },
    });
    const withSummaryCount = await prisma.repository.count({
      where: { summaryKo: { not: null } },
    });

    // ──────── 5. Translation Cache 용량 추정 ────────
    // 평균 README 크기로 추정 (실제 CHAR_LENGTH는 MySQL에서 직접 해야 정확)
    const avgReadmeSize = translationCount > 0
      ? await estimateTranslationCacheSize()
      : 0;

    // ──────── 6. 최근 크론잡 실행 기록 (api_usage_log 기반) ────────
    const recentCronLogs = await prisma.apiUsageLog.findMany({
      orderBy: { logDate: 'desc' },
      take: 10,
    });

    // ──────── 7. 오래된 데이터 경고 ────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldSnapshotCount = await prisma.trendingSnapshot.count({
      where: { snapshotDate: { lt: thirtyDaysAgo } },
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const oldLogCount = await prisma.apiUsageLog.count({
      where: { logDate: { lt: ninetyDaysAgo } },
    });

    // ──────── 8. 언어 분포 (상위 10개) ────────
    const languageDistribution = await prisma.repository.groupBy({
      by: ['language'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: {
        repositories: {
          count: repoCount,
          oldest: oldestRepo ? { date: oldestRepo.createdAt, name: oldestRepo.fullName } : null,
          newest: newestRepo ? { date: newestRepo.createdAt, name: newestRepo.fullName } : null,
          untranslated: untranslatedCount,
          withSummary: withSummaryCount,
        },
        trendingSnapshots: {
          count: snapshotCount,
          oldest: oldestSnapshot?.snapshotDate || null,
          newest: newestSnapshot?.snapshotDate || null,
          byPeriod: snapshotsByPeriod.map(s => ({
            period: s.period,
            count: s._count.id,
          })),
        },
        translationCache: {
          count: translationCount,
          estimatedSizeMB: avgReadmeSize,
        },
        apiUsageLog: {
          count: usageLogCount,
        },
      },
      cleanup: {
        snapshotsOlderThan30d: oldSnapshotCount,
        logsOlderThan90d: oldLogCount,
        recommendation: oldSnapshotCount > 100
          ? '⚠️ 30일 이상 된 스냅샷이 많습니다. 클린업을 실행하세요.'
          : '✅ 정상 범위',
      },
      recentCronActivity: recentCronLogs.map(l => ({
        service: l.serviceName,
        endpoint: l.endpoint,
        requests: l.requestsCount,
        tokens: l.tokensUsed,
        date: l.logDate,
      })),
      languageDistribution: languageDistribution.map(l => ({
        language: l.language || '(없음)',
        count: l._count.id,
      })),
    });

  } catch (error: any) {
    console.error('[Admin DB Stats Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Translation Cache의 대략적 용량(MB)을 추정합니다.
 * MySQL의 CHAR_LENGTH를 사용하여 실제 텍스트 크기를 계산합니다.
 */
async function estimateTranslationCacheSize(): Promise<number> {
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        ROUND(SUM(CHAR_LENGTH(readme_original) + CHAR_LENGTH(readme_ko)) / 1024 / 1024, 2) as size_mb
      FROM translation_cache
    `;
    return result[0]?.size_mb || 0;
  } catch {
    // Raw query 실패 시 추정치 반환
    const count = await prisma.translationCache.count();
    return Math.round(count * 0.03 * 100) / 100; // 평균 30KB per entry 추정
  }
}
