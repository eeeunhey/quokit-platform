'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Database, RefreshCcw, Trash2, ShieldCheck, LogOut,
  HardDrive, Clock, AlertTriangle, CheckCircle2,
  BarChart3, Globe, FileText, Activity
} from 'lucide-react';

// ─── 타입 정의 ───
interface TableInfo {
  count: number;
  oldest?: { date: string; name?: string } | string | null;
  newest?: { date: string; name?: string } | string | null;
  untranslated?: number;
  withSummary?: number;
  byPeriod?: { period: string; count: number }[];
  estimatedSizeMB?: number;
}

interface CleanupInfo {
  snapshotsOlderThan30d: number;
  logsOlderThan90d: number;
  recommendation: string;
}

interface CronLog {
  service: string;
  endpoint: string;
  requests: number;
  tokens: number;
  date: string;
}

interface LanguageDist {
  language: string;
  count: number;
}

interface DbStats {
  success: boolean;
  timestamp: string;
  tables: {
    repositories: TableInfo;
    trendingSnapshots: TableInfo;
    translationCache: TableInfo;
    apiUsageLog: TableInfo;
  };
  cleanup: CleanupInfo;
  recentCronActivity: CronLog[];
  languageDistribution: LanguageDist[];
}

interface CleanupResult {
  success: boolean;
  totalDeleted: number;
  details: {
    snapshots: { deleted: number; cutoff: string };
    translations: { deleted: number; cutoff: string };
    logs: { deleted: number; cutoff: string };
    orphanRepos: { deleted: number };
  };
}

// ─── 유틸 ───
function formatDate(d: string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function getAdminCookie(): string {
  const match = document.cookie.match(/admin_session=([^;]+)/);
  return match ? match[1] : '';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminCookie();
      const res = await fetch('/api/admin/db-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCleanup = async () => {
    if (!confirm('정말 DB 클린업을 실행하시겠습니까?\n\n• 30일 이상 된 스냅샷 삭제\n• 60일 이상 된 번역 캐시 삭제\n• 90일 이상 된 로그 삭제\n• 고아 레포 삭제')) {
      return;
    }
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const token = getAdminCookie();
      const res = await fetch('/api/cron/cleanup', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setCleanupResult(data);
      // 클린업 후 통계 갱신
      setTimeout(fetchStats, 1000);
    } catch (err: any) {
      alert('클린업 실패: ' + err.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0';
    window.location.href = '/admin/login';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ══════ 헤더 ══════ */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">QUOK-IT 관리자 대시보드</h1>
            <p className="text-xs text-zinc-500">
              DB 모니터링 · 클린업 · 시스템 상태
              {lastRefresh && (
                <span className="ml-2 text-zinc-600">
                  마지막 새로고침: {lastRefresh.toLocaleTimeString('ko-KR')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                       text-zinc-400 border border-zinc-700 rounded-lg
                       hover:text-white hover:border-zinc-500 transition-colors
                       disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                       text-zinc-500 border border-zinc-800 rounded-lg
                       hover:text-red-400 hover:border-red-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ══════ 에러 상태 ══════ */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* ══════ 로딩 상태 ══════ */}
      {loading && !stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* ══════ 1. 핵심 메트릭 카드 4개 ══════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              icon={<Database className="w-4 h-4" />}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              label="저장소"
              value={stats.tables.repositories.count}
              sub={`미번역 ${stats.tables.repositories.untranslated ?? 0}개`}
            />
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
              label="트렌딩 스냅샷"
              value={stats.tables.trendingSnapshots.count}
              sub={`30일+ : ${stats.cleanup.snapshotsOlderThan30d}개`}
              warn={stats.cleanup.snapshotsOlderThan30d > 100}
            />
            <MetricCard
              icon={<FileText className="w-4 h-4" />}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10"
              label="번역 캐시"
              value={stats.tables.translationCache.count}
              sub={`~${stats.tables.translationCache.estimatedSizeMB ?? '?'} MB`}
              warn={(stats.tables.translationCache.estimatedSizeMB ?? 0) > 100}
            />
            <MetricCard
              icon={<BarChart3 className="w-4 h-4" />}
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
              label="API 로그"
              value={stats.tables.apiUsageLog.count}
              sub={`90일+ : ${stats.cleanup.logsOlderThan90d}개`}
            />
          </div>

          {/* ══════ 2. 상세 정보 2열 그리드 ══════ */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            
            {/* 좌측: 데이터 날짜 범위 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-zinc-400" />
                데이터 날짜 범위
              </h3>
              <div className="space-y-3">
                <DateRange
                  label="저장소"
                  oldest={typeof stats.tables.repositories.oldest === 'object' && stats.tables.repositories.oldest
                    ? stats.tables.repositories.oldest.date : null}
                  newest={typeof stats.tables.repositories.newest === 'object' && stats.tables.repositories.newest
                    ? stats.tables.repositories.newest.date : null}
                  oldestName={typeof stats.tables.repositories.oldest === 'object' && stats.tables.repositories.oldest
                    ? stats.tables.repositories.oldest.name : undefined}
                />
                <DateRange
                  label="스냅샷"
                  oldest={typeof stats.tables.trendingSnapshots.oldest === 'string'
                    ? stats.tables.trendingSnapshots.oldest : null}
                  newest={typeof stats.tables.trendingSnapshots.newest === 'string'
                    ? stats.tables.trendingSnapshots.newest : null}
                />
              </div>
            </div>

            {/* 우측: 스냅샷 기간별 분포 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                스냅샷 기간별 분포
              </h3>
              <div className="space-y-2">
                {(stats.tables.trendingSnapshots.byPeriod || []).map(bp => (
                  <div key={bp.period} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-16">{bp.period}</span>
                    <div className="flex-1 h-6 bg-zinc-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-amber-500/30 rounded-lg flex items-center px-2"
                        style={{
                          width: `${Math.min(100, (bp.count / Math.max(1, stats.tables.trendingSnapshots.count)) * 100)}%`,
                          minWidth: '40px',
                        }}
                      >
                        <span className="text-[10px] font-mono text-amber-300">{bp.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!stats.tables.trendingSnapshots.byPeriod || stats.tables.trendingSnapshots.byPeriod.length === 0) && (
                  <p className="text-xs text-zinc-600">데이터 없음</p>
                )}
              </div>

              {/* 번역 상태 요약 */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-400 mb-2">번역 상태</h4>
                <div className="flex gap-4">
                  <div className="text-xs">
                    <span className="text-zinc-500">번역 완료: </span>
                    <span className="text-green-400 font-mono">
                      {stats.tables.repositories.count - (stats.tables.repositories.untranslated ?? 0)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-zinc-500">AI 요약: </span>
                    <span className="text-purple-400 font-mono">{stats.tables.repositories.withSummary ?? 0}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-zinc-500">미번역: </span>
                    <span className="text-red-400 font-mono">{stats.tables.repositories.untranslated ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ 3. 언어 분포 + 크론 활동 ══════ */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            
            {/* 언어 분포 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-zinc-400" />
                언어 분포 (상위 10)
              </h3>
              <div className="space-y-1.5">
                {stats.languageDistribution.map((lang, i) => {
                  const maxCount = stats.languageDistribution[0]?.count || 1;
                  const colors = [
                    'bg-blue-500/30 text-blue-300',
                    'bg-amber-500/30 text-amber-300',
                    'bg-green-500/30 text-green-300',
                    'bg-purple-500/30 text-purple-300',
                    'bg-red-500/30 text-red-300',
                    'bg-cyan-500/30 text-cyan-300',
                    'bg-pink-500/30 text-pink-300',
                    'bg-orange-500/30 text-orange-300',
                    'bg-emerald-500/30 text-emerald-300',
                    'bg-indigo-500/30 text-indigo-300',
                  ];
                  return (
                    <div key={lang.language} className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400 w-24 truncate">{lang.language}</span>
                      <div className="flex-1 h-5 bg-zinc-800 rounded overflow-hidden">
                        <div
                          className={`h-full rounded flex items-center px-1.5 ${colors[i % colors.length]}`}
                          style={{ width: `${Math.max(8, (lang.count / maxCount) * 100)}%` }}
                        >
                          <span className="text-[10px] font-mono">{lang.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 최근 크론 활동 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-zinc-400" />
                최근 크론/시스템 활동
              </h3>
              <div className="space-y-1">
                {stats.recentCronActivity.length > 0 ? (
                  stats.recentCronActivity.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.service === 'system' ? 'bg-emerald-400' :
                        log.service === 'github' ? 'bg-blue-400' : 'bg-amber-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-zinc-300">{log.service}</span>
                        {log.endpoint && (
                          <span className="text-[10px] text-zinc-600 ml-1 font-mono">{log.endpoint}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        req:{log.requests} tok:{log.tokens}
                      </span>
                      <span className="text-[10px] text-zinc-600 shrink-0">
                        {formatDate(log.date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600">기록 없음</p>
                )}
              </div>
            </div>
          </div>

          {/* ══════ 4. 클린업 섹션 ══════ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-zinc-400" />
                DB 클린업
              </h3>
              <button
                onClick={handleCleanup}
                disabled={cleanupLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold
                           bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg
                           hover:bg-red-500/20 hover:border-red-500/30 transition-colors
                           disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${cleanupLoading ? 'animate-spin' : ''}`} />
                {cleanupLoading ? '정리 중...' : '클린업 실행'}
              </button>
            </div>

            {/* 클린업 대상 미리보기 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <CleanupPreview
                label="스냅샷 (30일+)"
                count={stats.cleanup.snapshotsOlderThan30d}
                warn={stats.cleanup.snapshotsOlderThan30d > 0}
              />
              <CleanupPreview
                label="로그 (90일+)"
                count={stats.cleanup.logsOlderThan90d}
                warn={stats.cleanup.logsOlderThan90d > 0}
              />
              <CleanupPreview
                label="번역 캐시"
                count={stats.tables.translationCache.count}
                warn={false}
                sub="60일+ 자동 삭제"
              />
              <CleanupPreview
                label="상태"
                count={-1}
                warn={stats.cleanup.snapshotsOlderThan30d > 100}
                statusText={stats.cleanup.recommendation}
              />
            </div>

            {/* 클린업 결과 */}
            {cleanupResult && (
              <div className={`mt-4 p-4 rounded-xl border ${
                cleanupResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {cleanupResult.success
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <AlertTriangle className="w-4 h-4 text-red-400" />
                  }
                  <span className="text-sm font-semibold text-white">
                    클린업 완료 — 총 {cleanupResult.totalDeleted}건 삭제
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">스냅샷</span>
                    <p className="text-emerald-300 font-mono">{cleanupResult.details.snapshots.deleted}건</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">번역</span>
                    <p className="text-emerald-300 font-mono">{cleanupResult.details.translations.deleted}건</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">로그</span>
                    <p className="text-emerald-300 font-mono">{cleanupResult.details.logs.deleted}건</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">고아 레포</span>
                    <p className="text-emerald-300 font-mono">{cleanupResult.details.orphanRepos.deleted}건</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════ 5. 보존 기간 안내 ══════ */}
          <div className="mt-6 px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              📌 <strong className="text-zinc-500">보존 정책:</strong>{' '}
              트렌딩 스냅샷 30일 · 번역 캐시 60일 · API 로그 90일 · 
              고아 레포(스냅샷 0개 + 번역 없음) 7일 유예 후 삭제.
              사용자는 항상 최근 48시간 이내의 최신 데이터만 조회합니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 서브 컴포넌트 ───

function MetricCard({ icon, iconColor, iconBg, label, value, sub, warn }: {
  icon: React.ReactNode; iconColor: string; iconBg: string;
  label: string; value: number; sub?: string; warn?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value.toLocaleString()}</p>
      {sub && (
        <p className={`text-[11px] mt-1 ${warn ? 'text-amber-400' : 'text-zinc-600'}`}>
          {warn && '⚠ '}{sub}
        </p>
      )}
    </div>
  );
}

function DateRange({ label, oldest, newest, oldestName }: {
  label: string; oldest: string | null; newest: string | null; oldestName?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-b-0">
      <span className="text-xs text-zinc-400 w-14">{label}</span>
      <div className="flex-1 flex items-center gap-2 text-[11px]">
        <span className="text-zinc-500">
          {formatDate(oldest)}
          {oldestName && <span className="text-zinc-700 ml-1">({oldestName})</span>}
        </span>
        <span className="text-zinc-700">→</span>
        <span className="text-zinc-300">{formatDate(newest)}</span>
      </div>
    </div>
  );
}

function CleanupPreview({ label, count, warn, sub, statusText }: {
  label: string; count: number; warn: boolean; sub?: string; statusText?: string;
}) {
  return (
    <div className={`px-3 py-2.5 rounded-lg border ${
      warn ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-800/50 border-zinc-800'
    }`}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      {statusText ? (
        <p className={`text-xs mt-1 ${warn ? 'text-amber-400' : 'text-emerald-400'}`}>{statusText}</p>
      ) : (
        <>
          <p className={`text-lg font-bold font-mono mt-0.5 ${warn ? 'text-amber-400' : 'text-zinc-300'}`}>
            {count.toLocaleString()}
          </p>
          {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
        </>
      )}
    </div>
  );
}
