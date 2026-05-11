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
      
      {/* SEO를 위한 상단 소개 텍스트 (구글봇 친화적) */}
      <div className="pt-10 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3 tracking-tight">
          GitHub 오픈소스 트렌딩 한국어 큐레이션
        </h1>
        <p className="text-text-secondary text-[15px] sm:text-base leading-relaxed max-w-3xl">
          QUOK-IT은 전 세계 수백만 명의 개발자들이 주목하는 GitHub의 인기 오픈소스 프로젝트(Trending Repositories)를 실시간으로 수집하고 분석합니다.
          매일 새롭게 떠오르는 신생 레포(Rising)와 꾸준히 화제가 되는 레포(Hot)를 <strong>한국어 번역 및 AI 요약</strong>과 함께 제공하여,
          국내 개발자들이 글로벌 기술 동향을 가장 빠르고 정확하게 파악할 수 있도록 돕습니다.
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
