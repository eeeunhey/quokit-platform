'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrendingPeriod, ProgrammingLanguage } from '@/types';

const PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: 'daily', label: '오늘 🔥' },
  { value: 'weekly', label: '이번 주' },
  { value: 'monthly', label: '이번 달' },
];

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'all', label: '모든 언어' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get('period') || 'daily';
  const currentLang = searchParams.get('language') || 'all';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    // 페이지 번호 초기화
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 w-full border-b border-theme-border mb-6">
      
      {/* 기간 필터 (Tabs 패턴) */}
      <div className="flex p-1 bg-theme-bg/50 border border-theme-border rounded-lg w-full md:w-auto overflow-hidden">
        {PERIODS.map(({ value, label }) => {
          const isActive = currentPeriod === value;
          return (
            <button
              key={value}
              onClick={() => updateFilters('period', value)}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive 
                  ? "bg-theme-card text-brand-500 shadow-sm border border-brand-500/20" 
                  : "text-theme-muted hover:text-theme-text hover:bg-theme-border/50"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 언어 필터 (드롭다운) */}
      <div className="relative w-full md:w-auto">
        <select
          value={currentLang}
          onChange={(e) => updateFilters('language', e.target.value)}
          className="appearance-none w-full md:w-48 bg-theme-card border border-theme-border text-theme-text text-sm font-medium rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer shadow-sm transition-colors hover:border-theme-muted"
        >
          {LANGUAGES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-theme-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      
    </div>
  );
}
