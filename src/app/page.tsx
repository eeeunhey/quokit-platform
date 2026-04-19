import { Suspense } from 'react';
import { TrendingPeriod, ProgrammingLanguage } from '@/types';
import { TrendingDashboard } from '@/components/dashboard/TrendingDashboard';
import { TrendingSidebar } from '@/components/dashboard/TrendingSidebar';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; language?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period || 'daily') as TrendingPeriod;
  const language = (params.language || 'all') as ProgrammingLanguage;
  const sort = (params.sort || 'stars') as 'stars' | 'forks';

  return (
    <div className="max-w-[1280px] mx-auto px-6">
      

      {/* ======= 메인 레이아웃 — 레포 리스트 70% + 사이드바 30% ======= */}
      <div className="flex gap-8 py-8">
        
        {/* 메인 레포 리스트 (70%) */}
        <main className="flex-1 min-w-0">
          <TrendingDashboard
            initialPeriod={period}
            initialLanguage={language}
            initialSort={sort}
          />

          {/* AdSense — 리스트 하단, 자연스러운 위치 */}
          <div className="mt-8 pt-8 border-t border-line" id="main-ad-bottom" aria-label="광고">
            <p className="text-[10px] text-text-tertiary mb-2 uppercase tracking-wider">Advertisement</p>
            {/* Google AdSense 인라인 광고 코드가 여기에 삽입됩니다 */}
          </div>
        </main>

        {/* 우측 사이드바 (30%) */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-[106px]">
            <Suspense fallback={<SidebarSkeleton />}>
              <TrendingSidebar />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="surface-card p-4 space-y-2">
          <div className="h-4 w-24 bg-surface-active rounded animate-pulse" />
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="h-3 w-full bg-surface-active rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
