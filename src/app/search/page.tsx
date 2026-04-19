import { Metadata } from 'next';
import { SearchBar } from '@/components/ui/SearchBar';
import { RepoKoreanCard } from '@/components/dashboard/RepoKoreanCard';
import { TrendingSidebar } from '@/components/dashboard/TrendingSidebar';

export const metadata: Metadata = {
  title: '검색',
  description: 'QUOK-IT에서 GitHub 레포지토리를 한국어로 검색하세요.',
};

async function searchRepos(query: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const results = query ? await searchRepos(query) : [];

  // 검색어가 없는 초기 빈 화면: 구글처럼 중앙에 검색창만 집중되게 배치
  if (!query) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-48 flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
          어떤 레포를 찾으시나요?
        </h1>
        <p className="text-sm text-text-tertiary mb-10">오픈소스 트렌드를 한국어 해설로 만나보세요.</p>
        <SearchBar defaultValue="" className="max-w-2xl" />
      </div>
    );
  }

  // 검색 결과가 있는 화면 (70/30 레이아웃)
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* ─── 좌측 메인 영역 ─── */}
      <div className="flex-1 min-w-0">
        
        {/* 검색 헤더 */}
        <div className="mb-6 flex flex-col gap-4">
          <SearchBar defaultValue={query} className="max-w-none w-full" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              검색 결과 <span className="text-accent">{results.length}</span>건
            </h2>
          </div>
        </div>

        {/* ─── 검색 결과 리스트 (메인 페이지와 동일한 리스트 뷰) ─── */}
        {results.length > 0 ? (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
            {results.map((repo: any, idx: number) => {
              const mappedRepo = {
                ...repo,
                gained_stars: 0,
                html_url: repo.htmlUrl || `https://github.com/${repo.fullName}`,
                owner_login: repo.ownerLogin || repo.fullName?.split('/')[0],
                name: repo.name || repo.fullName?.split('/')[1],
                full_name: repo.fullName || '',
                stars_count: repo.starsCount || 0,
                forks_count: repo.forksCount || 0,
                issues_count: repo.issuesCount || 0,
                description_ko: repo.descriptionKo,
                summary_ko: repo.summaryKo,
                topics: repo.topics || [],
              };
              
              return (
                <RepoKoreanCard
                  key={repo.id || idx}
                  repo={mappedRepo}
                  rank={idx + 1}
                  sortBy="stars"
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-surface-active/30 rounded-2xl border border-line">
            <p className="text-base font-bold text-text-primary mb-2">"{query}"에 대한 결과가 없습니다</p>
            <p className="text-sm text-text-secondary text-center">
              철자를 확인하시거나 원본 영문 레포지토리 이름으로 검색해보세요.
            </p>
          </div>
        )}
      </div>

      {/* ─── 우측 사이드바 ─── */}
      <TrendingSidebar />
    </div>
  );
}
