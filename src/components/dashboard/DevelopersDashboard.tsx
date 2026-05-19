'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, X, Code2, CalendarRange, Users, ChevronDown, Check, ExternalLink, Flame, ArrowUpRight } from 'lucide-react';
import { DeveloperDetail } from '@/components/developer/DeveloperDetail';
import { LanguageBadge } from '@/components/ui/LanguageBadge';

// ----------------------------------------------------------------------
// 커스텀 드롭다운 훅 및 컴포넌트 
// ----------------------------------------------------------------------
function useClickOutside<T extends HTMLElement>(ref: React.RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

interface DropdownProps {
  icon?: React.ElementType;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

function CustomDropdown({ icon: Icon, options, value, onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2 bg-white border rounded-xl text-[13px] font-medium transition-all duration-200
          ${open ? 'border-[#A7C4A0] ring-3 ring-[#EEF5EE] text-[#374151]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]'}`}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${open ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`} />}
          {selectedOption.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 ${open ? 'rotate-180 text-[#6F8F72]' : 'text-[#C6C6C6]'}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[150px] bg-white border border-[#E8ECE8] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-1 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto no-scrollbar">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between transition-colors
                    ${isSelected ? 'bg-[#F8FAF8] text-[#355E3B] font-semibold' : 'text-[#6B7280] font-normal hover:bg-[#F9FAFB] hover:text-[#374151]'}`}
                >
                  {opt.label}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#6F8F72]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 메인 대시보드 컴포넌트
// ----------------------------------------------------------------------
export function DevelopersDashboard() {
  // 필터 상태
  const [devType, setDevType] = useState<'trending' | 'all-time'>('trending');
  const [period, setPeriod] = useState('daily');
  const [language, setLanguage] = useState('all');
  const [displayCount, setDisplayCount] = useState('25');
  
  // 데이터 및 모달 상태
  const [realDevelopers, setRealDevelopers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDev, setSelectedDev] = useState<string | null>(null);

  // 백엔드 API에서 실제 트렌딩 개발자 정보 가져오기 (필터 파라미터 적용)
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/developers?limit=${displayCount}&lang=${language}&period=${period}&type=${devType}`)
      .then(res => res.json())
      .then(data => {
        setRealDevelopers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("개발자 목록 로드 실패", err);
        setIsLoading(false);
      });
  }, [displayCount, language, period, devType]); // 필터가 바뀔 때마다 즉각 연동

  useEffect(() => {
    if (selectedDev) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedDev]);

  const periodOptions = [
    { label: '오늘', value: 'daily' },
    { label: '이번 주', value: 'weekly' },
    { label: '이번 달', value: 'monthly' },
    { label: '전체 기간', value: 'all' },
  ];

  const languageOptions = [
    { label: '전체 언어', value: 'all' },
    { label: 'Python', value: 'python' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'JavaScript', value: 'javascript' },
    { label: '기타 언어들', value: 'others' },
  ];

  const countOptions = [
    { label: '25명', value: '25' },
    { label: '50명', value: '50' },
    { label: '100명', value: '100' },
  ];

  // 최고 점수 (Progress bar 비율 계산용)
  const maxHits = realDevelopers.length > 0 ? realDevelopers[0]?.hits || 1 : 1;

  return (
    <div className="w-full max-w-[1280px] mx-auto pb-10">
      
      {/* ───── 1. 상단 타이틀 & 필터 ───── */}
      <div className="mb-6 pt-2 md:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] flex items-center gap-2.5">
              {devType === 'trending' ? '급상승 트렌딩 개발자' : '역대 최고 인기 개발자'}
              {devType === 'trending' ? <TrendingUp className="w-5 h-5 text-[#E8875B]" /> : <Flame className="w-5 h-5 text-[#6F8F72]" />}
            </h1>
            <p className="text-[13px] text-[#9CA3AF] mt-1.5 font-normal">
              {devType === 'trending' 
                ? '오늘, 이번 주 새롭게 떠오르는 GitHub 실시간 개발자 순위' 
                : 'GitHub 누적 스타 수가 가장 많은 글로벌 Top 개발자 순위'}
            </p>
          </div>
          
          {/* 탭 스위처 */}
          <div className="flex bg-[#F3F4F6] p-1 rounded-xl shrink-0 mt-2 sm:mt-0">
            <button
              onClick={() => setDevType('trending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                devType === 'trending' 
                  ? 'bg-white text-[#1F2937] shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              🔥 급상승 트렌딩
            </button>
            <button
              onClick={() => setDevType('all-time')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                devType === 'all-time' 
                  ? 'bg-white text-[#1F2937] shadow-sm' 
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              🌟 역대 최고 인기
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <CustomDropdown 
            icon={CalendarRange}
            options={periodOptions} 
            value={period} 
            onChange={setPeriod} 
            className="w-[130px]"
          />
          <CustomDropdown 
            icon={Code2}
            options={languageOptions} 
            value={language} 
            onChange={setLanguage} 
            className="w-[140px]"
          />
          <CustomDropdown 
            icon={Users}
            options={countOptions} 
            value={displayCount} 
            onChange={setDisplayCount} 
            className="w-[110px]"
          />
        </div>
      </div>

      {/* ───── 2. 리스트 카드 ───── */}
      <div className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden shadow-sm relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
             <div className="w-6 h-6 border-[3px] border-[#EEF5EE] border-t-[#6F8F72] rounded-full animate-spin"></div>
             <p className="text-xs text-[#9CA3AF] mt-3">불러오는 중...</p>
          </div>
        )}

        {/* 테이블 헤더 */}
        <div className="hidden sm:flex items-center px-6 py-3 bg-[#FAFBFA] border-b border-[#F0F0F0] text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
          <span className="w-[44px] text-center shrink-0">#</span>
          <span className="flex-1 pl-16">개발자</span>
          <span className="w-[200px] text-right pr-2">트렌딩 점수</span>
        </div>

        {realDevelopers.map((dev, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const hitsRatio = Math.max(0.08, dev.hits / maxHits); // 최소 8% 바

          return (
            <div 
              key={dev.id} 
              onClick={() => setSelectedDev(dev.login)}
              className="group flex items-center px-4 sm:px-6 py-4 border-b border-[#F5F5F5] last:border-0 hover:bg-[#F8FAF8] transition-colors cursor-pointer"
            >
              {/* 1. 순위 */}
              <div className="w-[44px] shrink-0 flex items-center justify-center">
                {rank === 1 ? (
                  <span className="text-lg">🥇</span>
                ) : rank === 2 ? (
                  <span className="text-lg">🥈</span>
                ) : rank === 3 ? (
                  <span className="text-lg">🥉</span>
                ) : (
                  <span className="text-[14px] font-medium text-[#C4C4C4] tabular-nums">
                    {rank}
                  </span>
                )}
              </div>

              {/* 2. 아바타 */}
              <img 
                src={dev.avatar} 
                alt={dev.name} 
                className={`w-10 h-10 rounded-full object-cover shrink-0 ml-1 transition-all duration-200
                  ${isTop3 
                    ? 'ring-2 ring-[#E5E7EB] group-hover:ring-[#A7C4A0] ring-offset-1' 
                    : 'ring-1 ring-[#F0F0F0] group-hover:ring-[#D4E4D5]'
                  }`}
              />

              {/* 3. 이름 & 언어 */}
              <div className="min-w-0 flex flex-col ml-3.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] leading-tight truncate transition-colors
                    ${isTop3 
                      ? 'font-semibold text-[#1F2937] group-hover:text-[#355E3B]' 
                      : 'font-medium text-[#374151] group-hover:text-[#355E3B]'
                    }`}>
                    {dev.name === dev.login ? dev.login : dev.name}
                  </span>
                  {dev.topLang && dev.topLang !== 'Unknown' && (
                    <LanguageBadge language={dev.topLang} />
                  )}
                </div>
                <span className="text-[11px] text-[#B0B0B0] mt-0.5 font-mono truncate">
                  @{dev.login}
                </span>
              </div>

              {/* 4. 트렌딩 점수 — 프로그레스 바 */}
              <div className="hidden sm:flex items-center gap-3 ml-auto w-[200px] justify-end">
                <div className="w-[100px] h-[6px] bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500
                      ${rank === 1 
                        ? 'bg-gradient-to-r from-[#6F8F72] to-[#A7C4A0]' 
                        : rank <= 3 
                          ? 'bg-gradient-to-r from-[#8FAF8F] to-[#BDD4BD]' 
                          : 'bg-[#D4E4D5]'
                      }`}
                    style={{ width: `${hitsRatio * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Flame className="w-3 h-3 text-[#E8875B]" />
                  <span className={`text-[13px] tabular-nums
                    ${isTop3 ? 'font-semibold text-[#374151]' : 'font-normal text-[#6B7280]'}`}>
                    {dev.hits.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 모바일: 점수 */}
              <div className="flex sm:hidden items-center gap-1 ml-auto shrink-0">
                <Flame className="w-3 h-3 text-[#E8875B]" />
                <span className="text-[12px] text-[#6B7280] tabular-nums">
                  {dev.hits.toLocaleString()}
                </span>
              </div>

              {/* 5. 호버 화살표 (데스크탑) */}
              <div className="hidden sm:flex items-center ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                <ArrowUpRight className="w-4 h-4 text-[#A7C4A0]" />
              </div>
            </div>
          );
        })}
        
        {!isLoading && realDevelopers.length === 0 && (
          <div className="py-20 text-center text-[#9CA3AF] text-sm">
            해당 조건의 개발자 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* ───── 3. 개발자 상세 모달 ───── */}
      {selectedDev && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
          <div 
            className="absolute inset-0 bg-black/25 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedDev(null)} 
          />
          <div className="relative bg-white w-full max-w-[1400px] h-[92vh] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0] bg-white z-10 shrink-0">
              <span className="font-semibold text-[15px] tracking-tight text-[#374151]">개발자 프로필</span>
              <button 
                onClick={() => setSelectedDev(null)} 
                className="p-1.5 hover:bg-[#F3F4F6] rounded-lg transition-colors text-[#9CA3AF] hover:text-[#374151]"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:p-12 scroll-smooth bg-white">
              <DeveloperDetail username={selectedDev} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
