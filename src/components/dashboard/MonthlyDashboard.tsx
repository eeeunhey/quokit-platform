'use client';

import { useState } from 'react';
import { BarChart3, Star, GitFork, Merge, CircleDot, CheckCircle2 } from 'lucide-react';

const MOCK_MONTHLY_REPOS = [
  { id: 1, name: "facebook/react", desc: "The library for web and native user interfaces.", lang: "JavaScript", source: "GitHub", val: "+130,707" },
  { id: 2, name: "vercel/next.js", desc: "The React Framework", lang: "JavaScript", source: "GitHub", val: "+84,102" },
  { id: 3, name: "huggingface/transformers", desc: "State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.", lang: "Python", source: "GitHub", val: "+56,220" },
  { id: 4, name: "microsoft/vscode", desc: "Visual Studio Code", lang: "TypeScript", source: "GitHub", val: "+42,881" },
  { id: 5, name: "astral-sh/uv", desc: "An extremely fast Python package and project manager, written in Rust.", lang: "Rust", source: "GitHub", val: "+38,944" },
];

export function MonthlyDashboard() {
  const [metric, setMetric] = useState('stars');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('04');

  const metricTabs = [
    { id: 'stars', label: '별점 (Stars)', icon: Star },
    { id: 'forks', label: '포크 (Forks)', icon: GitFork },
    { id: 'merged', label: '병합된 PR', icon: Merge },
    { id: 'issues', label: '신규 이슈', icon: CircleDot },
    { id: 'closed', label: '해결된 이슈', icon: CheckCircle2 },
  ];

  const getMetricSuffix = () => {
    switch (metric) {
      case 'stars': return 'stars gained';
      case 'forks': return 'times forked';
      case 'merged': return 'PRs merged';
      case 'issues': return 'issues opened';
      case 'closed': return 'issues resolved';
      default: return 'actions';
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
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden shadow-sm">
        {MOCK_MONTHLY_REPOS.map((repo, idx) => (
          <div key={repo.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:px-8 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors gap-4">
            
            <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
              <span className="text-xl font-black text-[#D1D5DB] w-6 pt-0.5">{idx + 1}</span>
              <div className="min-w-0">
                <h4 className="text-[18px] font-bold text-[#1F2937] truncate cursor-pointer hover:text-[#6F8F72] transition-colors">
                  {repo.name}
                </h4>
                <p className="text-[14.5px] text-[#6B7280] mt-1.5 truncate sm:whitespace-normal sm:max-w-xl leading-relaxed">
                  {repo.desc}
                </p>
                <div className="flex gap-4 text-[13px] font-medium text-[#9CA3AF] mt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    {repo.lang}
                  </span>
                  <span>{repo.source}</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right pl-10 sm:pl-0 shrink-0">
              <div className="text-[26px] font-black tracking-tight text-[#1F2937] font-mono select-all">
                {repo.val}
              </div>
              <div className="text-[13px] font-medium text-[#6B7280] mt-0.5">
                {getMetricSuffix()}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
