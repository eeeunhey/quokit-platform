'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, Trophy, Code2, CalendarRange, Users, ChevronDown, Check } from 'lucide-react';
import { DeveloperDetail } from '@/components/developer/DeveloperDetail';

// ----------------------------------------------------------------------
// 커스텀 드롭다운 훅 및 컴포넌트 
// ----------------------------------------------------------------------
function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
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
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-[12px] text-[14px] font-semibold transition-all duration-200 shadow-sm
          ${open ? 'border-[#A7C4A0] ring-4 ring-[#EEF5EE] text-[#1F2937]' : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:text-[#1F2937]'}`}
      >
        <span className="flex items-center gap-2.5">
          {Icon && <Icon className={`w-[18px] h-[18px] ${open ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`} />}
          {selectedOption.label}
        </span>
        <ChevronDown className={`w-4 h-4 ml-3 transition-transform duration-200 ${open ? 'rotate-180 text-[#6F8F72]' : 'text-[#9CA3AF]'}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[160px] bg-white border border-[#E8ECE8] rounded-[16px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto no-scrollbar">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center justify-between transition-colors
                    ${isSelected ? 'bg-[#F8FAF8] text-[#355E3B] font-bold' : 'text-[#4B5563] font-medium hover:bg-[#F9FAFB] hover:text-[#1F2937]'}`}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-[#6F8F72]" />}
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
  const [period, setPeriod] = useState('daily');
  const [language, setLanguage] = useState('all');
  const [displayCount, setDisplayCount] = useState('25');
  
  // 데이터 및 모달 상태
  const [realDevelopers, setRealDevelopers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDev, setSelectedDev] = useState<string | null>(null);

  // 백엔드 API에서 실제 트렌딩 개발자 정보 가져오기
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/developers?limit=${displayCount}`)
      .then(res => res.json())
      .then(data => {
        setRealDevelopers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("개발자 목록 로드 실패", err);
        setIsLoading(false);
      });
  }, [displayCount]);

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
    { label: '25명 보기', value: '25' },
    { label: '50명 보기', value: '50' },
    { label: '100명 보기', value: '100' },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto animate-in fade-in duration-500">
      
      {/* 1. 상단 타이틀 & 필터 영역 */}
      <div className="mb-8 pt-2 md:pt-4 border-b border-[#F3F4F6] pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F2937] flex items-center gap-3">
          트렌딩 개발자
          <Trophy className="w-[26px] h-[26px] text-[#6F8F72] mt-1" />
        </h1>
        <p className="text-[15px] sm:text-[16px] text-[#6B7280] mt-3 font-medium">
          GitHub 트렌딩에 자주 등장한 개발자를 확인할 수 있습니다.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-3xl">
          <CustomDropdown 
            icon={CalendarRange}
            options={periodOptions} 
            value={period} 
            onChange={setPeriod} 
            className="w-full sm:w-[160px]"
          />
          <CustomDropdown 
            icon={Code2}
            options={languageOptions} 
            value={language} 
            onChange={setLanguage} 
            className="w-full sm:w-[180px]"
          />
          <CustomDropdown 
            icon={Users}
            options={countOptions} 
            value={displayCount} 
            onChange={setDisplayCount} 
            className="w-full sm:w-[150px]"
          />
        </div>
      </div>

      {/* 2. 리스트 영역 */}
      <div className="bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-sm relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
             <div className="w-8 h-8 border-4 border-[#EEF5EE] border-t-[#6F8F72] rounded-full animate-spin"></div>
             <p className="text-sm font-medium text-[#6B7280] mt-3">실제 데이터를 동기화 중입니다...</p>
          </div>
        )}

        {realDevelopers.map((dev, idx) => (
          <div 
            key={dev.id} 
            onClick={() => setSelectedDev(dev.login)}
            className="group flex items-center justify-between p-5 sm:px-8 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-5 sm:gap-6 min-w-0 pointer-events-none">
              <span className={`text-[16px] font-mono font-bold w-6 text-center ${idx < 3 ? 'text-[#1F2937]' : 'text-[#D1D5DB]'}`}>
                {idx + 1}
              </span>
              <img 
                src={dev.avatar} 
                alt={dev.name} 
                className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-full ring-1 ring-black/5 object-cover shrink-0" 
              />
              <div className="min-w-0">
                <h4 className="text-[17px] font-bold text-[#1F2937] truncate group-hover:text-[#6F8F72] transition-colors">
                  {dev.name} <span className="text-[#9CA3AF] font-medium text-[13px] ml-1.5">@{dev.login}</span>
                </h4>
                <p className="text-[14px] text-[#6B7280] mt-1.5 max-w-[280px] sm:max-w-md truncate">
                  {dev.bio}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAF8] text-[#355E3B] text-[12px] font-bold rounded-[8px] border border-[#E8ECE8]">
                <TrendingUp className="w-3.5 h-3.5" />
                트렌딩 점수 {(dev.hits || 0).toLocaleString()}점
              </div>
              <div className="text-[12px] font-semibold text-[#9CA3AF] mt-0.5 pr-1">
                주력: <span className="text-[#4B5563]">{dev.topLang}</span>
              </div>
            </div>
          </div>
        ))}
        
        {!isLoading && realDevelopers.length === 0 && (
          <div className="py-20 text-center text-[#6B7280]">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 3. 개발자 상세 정보 모달 */}
      {selectedDev && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20">
          <div 
            className="absolute inset-0 bg-[#0A0C0A]/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedDev(null)} 
          />
          <div className="relative bg-[#FAFBFB] w-full max-w-[1050px] max-h-[85vh] sm:max-h-[90vh] rounded-[24px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-[#E5E7EB] bg-white z-10 shrink-0 shadow-sm">
              <span className="font-extrabold text-[15px] sm:text-[16px] tracking-tight text-[#1F2937]">개발자 상세 프로필</span>
              <button 
                onClick={() => setSelectedDev(null)} 
                className="p-1.5 bg-[#F7F8FA] hover:bg-[#E5E7EB] rounded-full transition-colors text-[#6B7280] hover:text-[#1F2937]"
                aria-label="닫기"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:p-10 scroll-smooth bg-white">
              <DeveloperDetail username={selectedDev} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
