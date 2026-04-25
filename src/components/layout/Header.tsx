'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E8ECE8] transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        
        {/* 데스크탑 1줄, 모바일 3줄 스택 */}
        <div className="flex flex-col md:flex-row md:items-center min-h-[76px] py-4 md:py-0 gap-4 md:gap-8">
          
          {/* 1. 좌측: QUOK-IT 로고 및 보조문구 */}
          <div className="flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="font-extrabold text-[20px] sm:text-[22px] tracking-tight text-[#1F2937] flex items-baseline">
                QUOK<span className="text-[#6F8F72]">-IT</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#E5E7EB] hidden sm:block"></div>
              <span className="hidden sm:inline-block text-[13.5px] font-medium text-[#6B7280] tracking-tight mt-0.5">
                GitHub 트렌드 탐색
              </span>
            </Link>
          </div>

          {/* 2. 중앙: 탭 네비게이션 */}
          <nav className="flex items-center overflow-x-auto no-scrollbar -mx-2 px-2 md:mx-0 md:px-0 md:justify-center shrink-0">
            <div className="flex items-center gap-1">
              <TabLink href="/" currentPath={pathname}>저장소</TabLink>
              <TabLink href="/developers" currentPath={pathname}>개발자</TabLink>
              <TabLink href="/monthly" currentPath={pathname}>월간 반응</TabLink>
            </div>
          </nav>

          {/* 3. 우측: 검색 영역 (실제 동작) */}
          <div className="w-full md:flex-1 md:max-w-[520px] md:ml-auto">
            <form onSubmit={handleSearch} className="relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#6F8F72] transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="저장소, 개발자, 기술 스택 검색" 
                className="w-full h-[48px] md:h-[52px] pl-11 pr-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[16px] text-[15px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#A7C4A0] focus:ring-4 focus:ring-[#EEF5EE] transition-all shadow-sm"
              />
              {/* 단축키 힌트 - 데스크탑 전용 */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 opacity-60 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md shadow-sm">K</kbd>
              </div>
            </form>
          </div>

        </div>
      </div>
    </header>
  );
}

function TabLink({ href, currentPath, children }: { href: string; currentPath: string | null; children: React.ReactNode }) {
  const path = currentPath || '/';
  const isActive = href === '/' ? path === '/' : path.startsWith(href);
  
  return (
    <Link
      href={href}
      className={`
        shrink-0 px-4 py-2.5 text-[14.5px] font-semibold rounded-[12px] transition-all duration-200 select-none
        ${isActive 
          ? 'bg-[#EEF5EE] text-[#355E3B]' 
          : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F7F8FA]'
        }
      `}
    >
      {children}
    </Link>
  );
}
