'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, GitFork, Flame, Sparkles } from 'lucide-react';
import { TrendingPeriod, ProgrammingLanguage, TrendingRepository } from '@/types';
import { RepoKoreanCard } from './RepoKoreanCard';

type DataSource = 'hot' | 'rising';

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

const SOURCE_CONFIG = {
  rising: {
    icon: Sparkles,
    label: 'Rising',
    color: 'text-violet-500',
    activeBg: 'bg-violet-500/10 border-violet-500/30',
    heading: '✨ 떠오르는 신생 레포',
    description: (period: TrendingPeriod) => {
      const p = period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달';
      return `${p} 새로 만들어져서 빠르게 주목받기 시작한 프로젝트`;
    },
  },
  hot: {
    icon: Flame,
    label: 'Hot',
    color: 'text-orange-500',
    activeBg: 'bg-orange-500/10 border-orange-500/30',
    heading: '🔥 지금 뜨는 레포',
    description: (period: TrendingPeriod) => {
      const p = period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달';
      return `${p} 스타가 급상승 중인 프로젝트 — 신규·기존 레포 모두 포함`;
    },
  },
} as const;

export function TrendingDashboard({ initialPeriod, initialLanguage, initialSort }: Props) {
  const router = useRouter();
  const [source, setSource] = useState<DataSource>('rising');
  const [period, setPeriod] = useState(initialPeriod);
  const [language, setLanguage] = useState(initialLanguage);
  const [sort, setSort] = useState(initialSort);
  const [repos, setRepos] = useState<TrendingRepository[]>([]);
  const [loading, setLoading] = useState(true);

  const updateURL = useCallback((s: DataSource, p: TrendingPeriod, l: ProgrammingLanguage, so: 'stars' | 'forks') => {
    const params = new URLSearchParams();
    if (s !== 'rising') params.set('source', s);
    if (p !== 'daily') params.set('period', p);
    if (l !== 'all') params.set('language', l);
    if (so !== 'stars') params.set('sort', so);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function fetchData() {
      try {
        const res = await fetch(`/api/trending?source=${source}&period=${period}&language=${language}&per_page=20`);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        let data: TrendingRepository[] = json.data || [];
        
        // Stars/Forks 정렬 적용 (두 모드 모두)
        if (sort === 'forks') {
          data = [...data].sort((a, b) => b.forks_count - a.forks_count);
        } else if (source === 'hot') {
          // Hot은 gained_stars 기준 내림차순 (API에서 이미 정렬되어 오지만 안전하게)
          data = [...data].sort((a, b) => (b.gained_stars || 0) - (a.gained_stars || 0));
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
  }, [source, period, language, sort]);

  const handleSource = (s: DataSource) => { setSource(s); updateURL(s, period, language, sort); };
  const handlePeriod = (p: TrendingPeriod) => { setPeriod(p); updateURL(source, p, language, sort); };
  const handleLanguage = (l: ProgrammingLanguage) => { setLanguage(l); updateURL(source, period, l, sort); };
  const handleSort = (s: 'stars' | 'forks') => { setSort(s); updateURL(source, period, language, s); };

  const cfg = SOURCE_CONFIG[source];

  return (
    <div>
      {/* ======= 필터 컨트롤 바 ======= */}
      <div className="sticky top-14 z-40 -mx-1 px-1 py-3 
                      micro-glass border-b border-line mb-6">
        <div className="flex flex-col gap-3">
          
          {/* Row 1: 데이터 소스 토글 (🔥 Hot / ✨ Rising) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-surface-active rounded-xl border border-line">
              {(['rising', 'hot'] as const).map((s) => {
                const c = SOURCE_CONFIG[s];
                const Icon = c.icon;
                const isActive = source === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSource(s)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all
                      ${isActive
                        ? `bg-surface ${c.color} shadow-sm border ${c.activeBg}`
                        : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Stars/Forks 정렬 토글 */}
              <div className="flex items-center gap-1 p-1 bg-surface-active rounded-xl border border-line ml-auto">
                <button
                  onClick={() => handleSort('stars')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${sort === 'stars'
                      ? 'bg-surface text-star shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Stars
                </button>
                <button
                  onClick={() => handleSort('forks')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    ${sort === 'forks'
                      ? 'bg-surface text-fork shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  <GitFork className="w-3.5 h-3.5" />
                  Forks
                </button>
              </div>
          </div>

          {/* Row 2: 기간 + 언어 필터 */}
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
            {cfg.heading}
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {cfg.description(period)}
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
              sortBy={source === 'hot' ? 'stars' : sort}
            />
          ))}
        </div>
      ) : (
        <div className="surface-card p-16 text-center">
          <p className="text-text-secondary font-medium">
            {source === 'hot'
              ? '트렌딩 데이터를 불러오지 못했습니다.'
              : '데이터를 불러오지 못했습니다.'}
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            크론잡을 실행하거나 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      )}
    </div>
  );
}
