'use client';

import { useState } from 'react';
import { BarChart3, Star, GitFork, Merge, CircleDot, CheckCircle2 } from 'lucide-react';

const MOCK_MONTHLY_REPOS = [
  { id: 1, name: "facebook/react", desc: "웹 및 네이티브 사용자 인터페이스를 위한 라이브러리.", lang: "JavaScript", source: "GitHub", stats: { stars: "+130,707", forks: "+25,123", merged: "+1,420", issues: "+3,200", closed: "+2,900" }},
  { id: 2, name: "vercel/next.js", desc: "생산성을 극대화한 React 프레임워크", lang: "JavaScript", source: "GitHub", stats: { stars: "+84,102", forks: "+14,500", merged: "+980", issues: "+2,100", closed: "+1,800" }},
  { id: 3, name: "huggingface/transformers", desc: "Pytorch, TensorFlow 및 JAX를 위한 최첨단 머신러닝 라이브러리", lang: "Python", source: "GitHub", stats: { stars: "+56,220", forks: "+12,100", merged: "+750", issues: "+1,800", closed: "+1,650" }},
  { id: 4, name: "microsoft/vscode", desc: "인기 있는 텍스트 에디터, Visual Studio Code", lang: "TypeScript", source: "GitHub", stats: { stars: "+42,881", forks: "+8,900", merged: "+640", issues: "+1,500", closed: "+1,400" }},
  { id: 5, name: "astral-sh/uv", desc: "Rust로 작성된 매우 빠른 Python 패키지 및 프로젝트 관리자.", lang: "Rust", source: "GitHub", stats: { stars: "+38,944", forks: "+5,400", merged: "+320", issues: "+900", closed: "+850" }},
];

export function MonthlyDashboard() {
  const [metric, setMetric] = useState<'stars'|'forks'|'merged'|'issues'|'closed'>('stars');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('04');

  const metricTabs = [
    { id: 'stars', label: '별점 (Stars)', icon: Star },
    { id: 'forks', label: '포크 (Forks)', icon: GitFork },
    { id: 'merged', label: '병합된 PR', icon: Merge },
    { id: 'issues', label: '신규 이슈', icon: CircleDot },
    { id: 'closed', label: '해결된 이슈', icon: CheckCircle2 },
  ] as const;

  const getMetricSuffix = () => {
    switch (metric) {
      case 'stars': return '개의 생성된 별점';
      case 'forks': return '번의 체인 포크';
      case 'merged': return '개의 병합된 PR';
      case 'issues': return '개의 생성된 이슈';
      case 'closed': return '개의 해결된 이슈';
      default: return '건의 활성 활동';
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
          선택한 기준(별점, 포크, 병합된 PR 등)에 따라 지난 한 달간 가장 뜨거운 반응을 이끌어낸 오픈소스 프로젝트들을 심층 분석합니다.
        </p>
      </div>

      {/* 2. 상단 필터 (연석 메뉴 스타일 정렬) */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select 
          value={year} onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer"
        >
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>
        <select 
          value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer"
        >
          <option value="04">4월</option>
          <option value="03">3월</option>
          <option value="02">2월</option>
          <option value="01">1월</option>
        </select>
        <div className="w-px h-8 bg-[#E5E7EB] mx-1 hidden sm:block"></div>
        <select className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer">
          <option value="all">모든 언어</option>
          <option value="ts">TypeScript</option>
        </select>
        <select className="px-4 py-2.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1F2937] rounded-[12px] shadow-sm focus:outline-none focus:border-[#A7C4A0] cursor-pointer">
          <option value="all">전체 (생성일 무관)</option>
          <option value="recent">최근 1년 내 생성</option>
        </select>
      </div>

      {/* 3. 지표 탭 바 (세그먼트 스타일) */}
      <div className="flex overflow-x-auto no-scrollbar bg-white border border-[#E5E7EB] p-1.5 rounded-[16px] mb-8 w-fit shadow-sm">
        {metricTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = metric === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetric(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[14.5px] font-bold rounded-[12px] transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#F7F8FA] text-[#1F2937] ring-1 ring-black/5 shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. 랭킹 리스트 영역 */}
      <div className="bg-white border text-left border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-sm">
        
        {/* 리스트 헤더 부분 */}
        <div className="p-5 border-b border-[#E5E7EB] bg-white">
          <h3 className="font-bold text-[#1F2937] text-[15px]">
            선택한 지표 기준 인기 저장소
          </h3>
          <p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            이번 달 데이터는 매일 자동 업데이트됩니다
          </p>
        </div>

        <div>
          {MOCK_MONTHLY_REPOS.map((repo, idx) => (
            <div key={repo.id} className="flex flex-col sm:flex-row justify-between p-6 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors gap-6">
              
              <div className="flex-1 min-w-0">
                <h4 className="text-[16px] sm:text-[18px] font-bold text-[#5569C6] truncate cursor-pointer hover:underline transition-colors">
                  {repo.name}
                </h4>
                
                {/* 메타데이터 뱃지 줄 (별점/포크/출처/언어) */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[13px] font-medium text-[#4B5563] mt-2 mb-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {repo.stats.stars.replace('+', '')}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-4 h-4 text-[#6B7280]" />
                    {repo.stats.forks.replace('+', '')}
                  </span>
                  <span className="flex items-center gap-1 ml-1">
                    <img src="https://github.githubassets.com/favicons/favicon.svg" alt="GitHub" className="w-3.5 h-3.5 opacity-70" />
                    GitHub
                  </span>
                  <span className="flex items-center gap-1.5 ml-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    {repo.lang}
                  </span>
                </div>

                <p className="text-[14px] text-[#4B5563] truncate sm:whitespace-normal sm:max-w-3xl leading-relaxed">
                  {repo.desc}
                </p>
              </div>

              {/* 우측 거대 지표 스탯 */}
              <div className="sm:text-right shrink-0 sm:pt-1">
                <div className="text-[18px] sm:text-[22px] font-semibold text-[#1F2937]">
                  {repo.stats[metric]}
                </div>
                <div className="text-[12px] sm:text-[13px] text-[#9CA3AF] mt-1">
                  {getMetricSuffix()} in {month}월, {year}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
