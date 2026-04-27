import { Metadata } from 'next';
import { SearchBar } from '@/components/ui/SearchBar';
import { RepoKoreanCard } from '@/components/dashboard/RepoKoreanCard';
import { TrendingSidebar } from '@/components/dashboard/TrendingSidebar';
import { ExternalLink, Users, Code2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '검색',
  description: 'QUOK-IT에서 GitHub 레포지토리와 개발자를 한국어로 검색하세요.',
};

interface Developer {
  _type: 'developer';
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

async function searchAll(query: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { repos: [], developers: [] };
    const json = await res.json();
    return {
      repos: json.data || [],
      developers: json.developers || [],
    };
  } catch {
    return { repos: [], developers: [] };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const { repos, developers } = query ? await searchAll(query) : { repos: [], developers: [] };
  const totalResults = repos.length + developers.length;

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

  // 검색 결과가 있는 화면 (메인 페이지와 동일한 70/30 레이아웃)
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* ─── 좌측 메인 영역 ─── */}
      <main className="flex-1 min-w-0">
        
        {/* 검색 헤더 */}
        <div className="mb-6 flex flex-col gap-4">
          <SearchBar defaultValue={query} className="max-w-none w-full" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              검색 결과 <span className="text-accent">{totalResults}</span>건
            </h2>
          </div>
        </div>

        {/* ─── 개발자 검색 결과 ─── */}
        {developers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4.5 h-4.5 text-[#6F8F72]" />
              <h3 className="text-[15px] font-bold text-[#1F2937]">개발자</h3>
              <span className="text-xs font-semibold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{developers.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {developers.map((dev: Developer) => (
                <a
                  key={dev.id}
                  href={dev.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white border border-[#E5E7EB] rounded-2xl hover:border-[#A7C4A0] hover:shadow-md transition-all duration-200"
                >
                  <img 
                    src={dev.avatar_url} 
                    alt={dev.login} 
                    className="w-12 h-12 rounded-full ring-2 ring-[#E5E7EB] group-hover:ring-[#A7C4A0] ring-offset-1 object-cover shrink-0 transition-all"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#1F2937] group-hover:text-[#355E3B] transition-colors truncate">
                        {dev.login}
                      </span>
                      {dev.type === 'Organization' && (
                        <span className="text-[10px] font-bold text-[#6F8F72] bg-[#EEF5EE] px-1.5 py-0.5 rounded-md shrink-0">ORG</span>
                      )}
                    </div>
                    <span className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <Code2 className="w-3 h-3" />
                      GitHub {dev.type === 'Organization' ? '조직' : '개발자'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#6F8F72] transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── 레포지토리 검색 결과 ─── */}
        {repos.length > 0 && (
          <div>
            {developers.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-4.5 h-4.5 text-[#6F8F72]" />
                <h3 className="text-[15px] font-bold text-[#1F2937]">레포지토리</h3>
                <span className="text-xs font-semibold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{repos.length}</span>
              </div>
            )}
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              {repos.map((repo: any, idx: number) => {
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
          </div>
        )}

        {/* 결과 없음 */}
        {totalResults === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-surface-active/30 rounded-2xl border border-line">
            <p className="text-base font-bold text-text-primary mb-2">"{query}"에 대한 결과가 없습니다</p>
            <p className="text-sm text-text-secondary text-center">
              철자를 확인하시거나 원본 영문 레포지토리 이름으로 검색해보세요.
            </p>
          </div>
        )}
      </main>

      {/* ─── 우측 사이드바 (메인 페이지와 동일한 비율) ─── */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-[106px]">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}
