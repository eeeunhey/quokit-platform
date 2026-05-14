import { TrendingPeriod, ProgrammingLanguage } from '@/types';
import { TrendingDashboard } from '@/components/dashboard/TrendingDashboard';
import { TrendingSidebar } from '@/components/dashboard/TrendingSidebar';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; period?: string; language?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const source = (params.source || 'hot') as 'hot' | 'rising';
  const period = (params.period || 'daily') as TrendingPeriod;
  const language = (params.language || 'all') as ProgrammingLanguage;
  const sort = (params.sort || 'stars') as 'stars' | 'forks';

  return (
    <div className="max-w-[1280px] mx-auto px-6">
      
      {/* SEO를 위한 상단 소개 텍스트 (시각적으로 더욱 작고 은은하게) */}
      <div className="pt-6 pb-2">
        <h1 className="text-base font-semibold text-text-secondary mb-1 tracking-tight">
          GitHub 오픈소스 트렌딩, 한국어로 한눈에
        </h1>
        <p className="text-text-tertiary text-[13px] leading-relaxed max-w-4xl">
          QUOK-IT은 전 세계 개발자들이 주목하는 GitHub 인기 레포지토리를 실시간으로 분석하여 소개합니다. 
          지금 핫하게 떠오르는 트렌딩 프로젝트부터 새롭게 조명받는 오픈소스까지, 
          꼭 필요한 핵심만 담은 AI 요약과 한국어 번역으로 최신 기술 동향을 더욱 빠르고 편안하게 파악해 보세요.
        </p>
      </div>

      {/* ======= 메인 레이아웃 — 레포 리스트 70% + 사이드바 30% ======= */}
      <div className="flex gap-8 py-6">
        
        {/* 메인 레포 리스트 (70%) */}
        <main className="flex-1 min-w-0">
          <TrendingDashboard
            initialPeriod={period}
            initialLanguage={language}
            initialSort={sort}
          />
        </main>

        {/* 우측 사이드바 (30%) 
            TrendingSidebar는 이제 클라이언트 컴포넌트로 자체적으로 데이터를 fetch합니다. */}
        <div className="hidden lg:block w-72 shrink-0 pt-[80px]">
          <div className="sticky top-[100px]">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
