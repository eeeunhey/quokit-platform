import prisma from '@/lib/db';
import { Star, GitFork, TrendingUp, Sparkles } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

type SignalItem = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
};

export async function SignalPanel() {
  // DB에서 오늘의 핵심 지표를 가져옵니다
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let signals: SignalItem[] = [];

  try {
    // 오늘의 최고 Star 레포
    const topStar = await prisma.repository.findFirst({
      orderBy: { starsCount: 'desc' },
      where: {
        trendingSnapshots: {
          some: {
            period: 'daily',
            snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) }
          }
        }
      },
      select: { fullName: true, starsCount: true }
    });

    // 오늘의 최고 Fork 레포
    const topFork = await prisma.repository.findFirst({
      orderBy: { forksCount: 'desc' },
      where: {
        trendingSnapshots: {
          some: {
            period: 'daily',
            snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) }
          }
        }
      },
      select: { fullName: true, forksCount: true }
    });

    // 총 트렌딩 레포 수
    const totalTrending = await prisma.trendingSnapshot.count({
      where: {
        period: 'daily',
        snapshotDate: { gte: new Date(today.getTime() - 48 * 60 * 60 * 1000) }
      }
    });

    // 번역 완료 비율
    const totalRepos = await prisma.repository.count();
    const translatedRepos = await prisma.repository.count({
      where: { descriptionKo: { not: null } }
    });

    signals = [
      {
        label: 'Today Trending',
        value: topStar?.fullName?.split('/')[1] || '—',
        sub: topStar ? `★ ${formatCompactNumber(topStar.starsCount)}` : undefined,
        icon: <Star className="w-3.5 h-3.5" />,
        accent: 'text-star',
      },
      {
        label: 'Most Forked',
        value: topFork?.fullName?.split('/')[1] || '—',
        sub: topFork ? `⑂ ${formatCompactNumber(topFork.forksCount)}` : undefined,
        icon: <GitFork className="w-3.5 h-3.5" />,
        accent: 'text-fork',
      },
      {
        label: '트렌딩 레포',
        value: `${totalTrending}`,
        sub: '개 수집됨',
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        accent: 'text-accent',
      },
      {
        label: '한국어 번역',
        value: totalRepos > 0 ? `${Math.round((translatedRepos / totalRepos) * 100)}%` : '—',
        sub: `${translatedRepos}/${totalRepos}`,
        icon: <Sparkles className="w-3.5 h-3.5" />,
        accent: 'text-accent-muted',
      },
    ];
  } catch (error) {
    console.error('[SignalPanel] Error:', error);
    signals = [
      { label: 'Today Trending', value: '—', icon: <Star className="w-3.5 h-3.5" />, accent: 'text-star' },
      { label: 'Most Forked', value: '—', icon: <GitFork className="w-3.5 h-3.5" />, accent: 'text-fork' },
      { label: '트렌딩 레포', value: '—', icon: <TrendingUp className="w-3.5 h-3.5" />, accent: 'text-accent' },
      { label: '한국어 번역', value: '—', icon: <Sparkles className="w-3.5 h-3.5" />, accent: 'text-accent-muted' },
    ];
  }

  return (
    <div className="surface-card p-5 animate-in" style={{ animationDelay: '100ms' }}>
      <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">
        Today&apos;s Signal
      </h2>
      <div className="space-y-3">
        {signals.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
            <div className="flex items-center gap-2.5">
              <span className={s.accent}>{s.icon}</span>
              <span className="text-sm text-text-secondary">{s.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-text-primary data-num">{s.value}</span>
              {s.sub && (
                <span className="ml-1.5 text-xs text-text-tertiary">{s.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
