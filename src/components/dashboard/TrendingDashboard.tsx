'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, GitFork } from 'lucide-react';
import { TrendingPeriod, ProgrammingLanguage, TrendingRepository } from '@/types';
import { RepoKoreanCard } from './RepoKoreanCard';

interface Props {
  initialPeriod: TrendingPeriod;
  initialLanguage: ProgrammingLanguage;
  initialSort: 'stars' | 'forks';
}

const PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: 'daily', label: '오늘' },
  { value: 'weekly', label: '이번 주' },
  { value: 'monthly', label: '이번 달' },
];

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'all', label: '전체 언어' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

export function TrendingDashboard({ initialPeriod, initialLanguage, initialSort }: Props) {
  const router = useRouter();
  const [period, setPeriod] = useState(initialPeriod);
  const [language, setLanguage] = useState(initialLanguage);
  const [sort, setSort] = useState(initialSort);
  const [repos, setRepos] = useState<TrendingRepository[]>([]);
  const [loading, setLoading] = useState(true);

  const updateURL = useCallback((p: TrendingPeriod, l: ProgrammingLanguage, s: 'stars' | 'forks') => {
    const params = new URLSearchParams();
    if (p !== 'daily') params.set('period', p);
    if (l !== 'all') params.set('language', l);
    if (s !== 'stars') params.set('sort', s);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function fetchData() {
      try {
        const res = await fetch(`/api/trending?period=${period}&language=${language}&per_page=20`);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        let data: TrendingRepository[] = json.data || [];
        if (sort === 'forks') {
          data = [...data].sort((a, b) => b.forks_count - a.forks_count);
        }
        if (!cancelled) setRepos(data);
      } catch {
        if (!cancelled) setRepos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period, language, sort]);

  const handlePeriod = (p: TrendingPeriod) => { setPeriod(p); updateURL(p, language, sort); };
  const handleLanguage = (l: ProgrammingLanguage) => { setLanguage(l); updateURL(period, l, sort); };
  const handleSort = (s: 'stars' | 'forks') => { setSort(s); updateURL(period, language, s); };

  return (
    <div>
      {/* ======= 필터 컨트롤 바 ======= */}
      <div className="sticky top-14 z-40 -mx-1 px-1 py-3 
                      micro-glass border-b border-line mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Stars / Forks 메인 토글 */}
          <div className="flex items-center gap-1 p-1 bg-surface-active rounded-xl border border-line">
            <button
              onClick={() => handleSort('stars')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all
                ${sort === 'stars'
                  ? 'bg-surface text-star shadow-sm border border-star-border'
                  : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <Star className="w-4 h-4" />
              Stars 트렌딩
              {sort === 'stars' && (
                <span className="ml-1 text-xs text-text-tertiary font-normal">화제성</span>
              )}
            </button>
            <button
              onClick={() => handleSort('forks')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all
                ${sort === 'forks'
                  ? 'bg-surface text-fork shadow-sm border border-fork-border'
                  : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <GitFork className="w-4 h-4" />
              Forks 인기
              {sort === 'forks' && (
                <span className="ml-1 text-xs text-text-tertiary font-normal">실용성</span>
              )}
            </button>
          </div>

          {/* 기간 + 언어 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-surface-active rounded-xl border border-line">
              {PERIODS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handlePeriod(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${period === value
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguage(e.target.value as ProgrammingLanguage)}
              className="px-2.5 py-2 text-xs font-medium text-text-secondary bg-surface
                         border border-line rounded-xl hover:border-line-hover
                         focus:outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ======= 섹션 헤더 ======= */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {sort === 'stars' ? '🔥 Stars 트렌딩' : '⑂ Forks 인기 레포'}
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {sort === 'stars'
              ? `${period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달'} 가장 주목받고 있는 레포`
              : '실제로 많이 복제되어 활용되는 레포'}
            {language !== 'all' ? ` — ${language}` : ''}
          </p>
        </div>
        {!loading && repos.length > 0 && (
          <span className="text-xs text-text-tertiary data-num">{repos.length}개</span>
        )}
      </div>

      {/* ======= 레포 리스트 ======= */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-card p-5 space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-surface-active rounded-lg animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-5 w-48 bg-surface-active rounded animate-pulse" />
                  <div className="h-3 w-32 bg-surface-active rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full bg-surface-active rounded animate-pulse" />
              <div className="h-9 bg-surface-active/50 rounded-xl animate-pulse" />
              <div className="flex gap-2">
                {[1,2,3].map(j => (
                  <div key={j} className="h-5 w-16 bg-surface-active rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : repos.length > 0 ? (
        <div className="space-y-3 stagger">
          {repos.map((repo, idx) => (
            <RepoKoreanCard
              key={`${repo.full_name}-${idx}`}
              repo={repo}
              rank={idx + 1}
              sortBy={sort}
            />
          ))}
        </div>
      ) : (
        <div className="surface-card p-16 text-center">
          <p className="text-text-secondary font-medium">데이터를 불러오지 못했습니다.</p>
          <p className="text-sm text-text-tertiary mt-1">크론잡을 실행하거나 잠시 후 다시 시도해 주세요.</p>
        </div>
      )}
    </div>
  );
}
