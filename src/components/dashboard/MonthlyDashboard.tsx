'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Star, GitFork, Merge, CircleDot, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

type Metric = 'stars' | 'forks' | 'merged' | 'issues' | 'closed';

interface MonthlyRepo {
  name: string;
  desc: string;
  lang: string;
  langColor: string;
  stars: string;
  forks: string;
  htmlUrl: string;
  value: string;
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
};

export function MonthlyDashboard() {
  const now = new Date();
  const [metric, setMetric] = useState<Metric>('stars');
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [lang, setLang] = useState('all');

  const [repos, setRepos] = useState<MonthlyRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/monthly?metric=${metric}&year=${year}&month=${month}&lang=${lang}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '데이터를 가져오지 못했습니다.');
      setRepos(json.data);
    } catch (e: any) {
      setError(e.message);
      setRepos([]);
    } finally {
      setIsLoading(false);
    }
  }, [metric, year, month, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metricTabs = [
    { id: 'stars' as Metric, label: '별점', icon: Star },
    { id: 'forks' as Metric, label: '포크', icon: GitFork },
    { id: 'merged' as Metric, label: '병합된 PR', icon: Merge },
    { id: 'issues' as Metric, label: '신규 이슈', icon: CircleDot },
    { id: 'closed' as Metric, label: '해결된 이슈', icon: CheckCircle2 },
  ] as const;

  const getMetricSuffix = () => {
    switch (metric) {
      case 'stars':   return `개의 별점 · ${month}월 ${year}`;
      case 'forks':   return `번의 포크 · ${month}월 ${year}`;
      case 'merged':  return `개의 병합된 PR · ${month}월 ${year}`;
      case 'issues':  return `개의 신규 이슈 · ${month}월 ${year}`;
      case 'closed':  return `개의 해결된 이슈 · ${month}월 ${year}`;
    }
  };

  const getMetricHeaderLabel = () => {
    switch (metric) {
      case 'stars':   return '별점 기준 인기 저장소';
      case 'forks':   return '포크 기준 인기 저장소';
      case 'merged':  return '병합된 PR 기준 활발한 저장소';
      case 'issues':  return '신규 이슈 기준 활발한 저장소';
      case 'closed':  return '해결된 이슈 기준 활발한 저장소';
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto animate-in fade-in duration-500">

      {/* 1. 상단 제목 */}
      <div className="mb-6 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F2937] flex items-center gap-3">
          저장소 월간 반응
          <BarChart3 className="w-6 h-6 text-[#6F8F72] mt-1" />
        </h1>
        <p className="text-[15px] sm:text-base text-[#6B7280] mt-3 max-w-2xl">
          선택한 기준(별점, 포크, 병합된 PR 등)에 따라 지난 한 달간 가장 뜨거운 반응을 이끌어낸 오픈소스 프로젝트들을 분석합니다.
        </p>
      </div>

      {/* 2. 필터 영역 */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer"
        >
          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
            <option key={m} value={m}>{Number(m)}월</option>
          ))}
        </select>
        <select
          value={year} onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer"
        >
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
          <option value="2024">2024년</option>
        </select>
        <div className="w-px h-8 bg-[#E5E7EB] mx-1 hidden sm:block" />
        <select
          value={lang} onChange={(e) => setLang(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer"
        >
          <option value="all">모든 언어</option>
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Rust">Rust</option>
          <option value="Go">Go</option>
          <option value="Java">Java</option>
        </select>
      </div>

      {/* 3. 지표 탭 */}
      <div className="flex overflow-x-auto no-scrollbar bg-white border border-[#E5E7EB] p-1.5 rounded-[16px] mb-8 w-fit shadow-sm">
        {metricTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = metric === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetric(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[14px] font-bold rounded-[12px] transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#EEF5EE] text-[#355E3B] ring-1 ring-[#A7C4A0] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. 리스트 */}
      <div className="bg-white border text-left border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-sm">

        {/* 리스트 헤더 */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1F2937] text-[15px]">{getMetricHeaderLabel()}</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#6F8F72]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              선택한 기간(월) 기준 글로벌 최상위 데이터입니다
            </p>
          </div>
          {isLoading && (
            <Loader2 className="w-5 h-5 text-[#6F8F72] animate-spin" />
          )}
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
            <Loader2 className="w-8 h-8 text-[#6F8F72] animate-spin mb-3" />
            <p className="text-sm font-medium">GitHub에서 실시간 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {!isLoading && error && (
          <div className="py-16 text-center text-[#6B7280]">
            <p className="text-sm font-medium text-red-500">⚠️ {error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 text-sm font-semibold text-[#6F8F72] border border-[#A7C4A0] rounded-[10px] hover:bg-[#EEF5EE] transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* 결과 리스트 */}
        {!isLoading && !error && repos.map((repo, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row justify-between p-6 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors gap-6">

            <div className="flex-1 min-w-0">
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[16px] sm:text-[17px] font-bold text-[#5569C6] hover:underline"
              >
                {repo.name}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              {/* 메타 배지 */}
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#4B5563] mt-2 mb-2.5">
                {repo.stars !== '-' && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {repo.stars}
                  </span>
                )}
                {repo.forks !== '-' && (
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-[#6B7280]" />
                    {repo.forks}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" className="w-3.5 h-3.5 opacity-70" />
                  GitHub
                </span>
                {repo.lang && repo.lang !== 'N/A' && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: LANG_COLORS[repo.lang] || '#6B7280' }}
                    />
                    {repo.lang}
                  </span>
                )}
              </div>

              <p className="text-[14px] text-[#6B7280] leading-relaxed line-clamp-2">
                {repo.desc}
              </p>
            </div>

            {/* 우측 지표 숫자 */}
            <div className="sm:text-right shrink-0 pt-1">
              <div className="text-[22px] sm:text-[26px] font-bold text-[#1F2937] tabular-nums">
                {repo.value}
              </div>
              <div className="text-[12px] text-[#9CA3AF] mt-1">
                {getMetricSuffix()}
              </div>
            </div>

          </div>
        ))}

        {/* 빈 상태 */}
        {!isLoading && !error && repos.length === 0 && (
          <div className="py-16 text-center text-[#6B7280] text-sm">
            해당 조건에 맞는 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
