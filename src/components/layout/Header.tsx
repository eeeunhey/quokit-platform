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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E8ECE8]">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        
        {/* 데스크탑/모바일 공통: 안정적인 고정 높이/패딩 유지 */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-3 md:py-0 min-h-[60px]">
          
          {/* 1. 좌측: QUOK-IT 로고 */}
          <div className="flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="font-extrabold tracking-tight text-[#1F2937] flex items-baseline text-[20px]">
                QUOK<span className="text-[#6F8F72]">-IT</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#E5E7EB] hidden sm:block"></div>
              <span className="hidden sm:inline-block text-[13px] font-medium text-[#9CA3AF] tracking-tight">
                GitHub 트렌드 탐색
              </span>
            </Link>
          </div>

          {/* 2. 중앙: 탭 네비게이션 */}
          <nav className="flex items-center overflow-x-auto no-scrollbar -mx-2 px-2 md:mx-0 md:px-0 md:justify-center shrink-0">
            <div className="flex items-center gap-0.5">
              <TabLink href="/" currentPath={pathname}>저장소</TabLink>
              <TabLink href="/developers" currentPath={pathname}>개발자</TabLink>
              <TabLink href="/monthly" currentPath={pathname}>월간 반응</TabLink>
            </div>
          </nav>

          {/* 3. 우측: 검색 영역 */}
          <div className="w-full md:flex-1 md:max-w-[480px] md:ml-auto">
            <form onSubmit={handleSearch} className="relative group w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4C4] group-focus-within:text-[#6F8F72] transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="저장소, 개발자, 기술 스택 검색" 
                className="w-full pl-10 pr-4 bg-[#F7F8FA] border border-[#ECECEC] rounded-xl text-[14px] text-[#374151] placeholder:text-[#C4C4C4] focus:outline-none focus:bg-white focus:border-[#A7C4A0] focus:ring-3 focus:ring-[#EEF5EE] transition-all h-[42px]"
              />
              {/* 단축키 힌트 - 데스크탑 전용 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 opacity-40 pointer-events-none">
                <kbd className="px-1 py-0.5 text-[9px] font-medium text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded">⌘</kbd>
                <kbd className="px-1 py-0.5 text-[9px] font-medium text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded">K</kbd>
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
        shrink-0 px-3.5 rounded-lg transition-all duration-200 select-none text-[13px] font-semibold py-2
        ${isActive 
          ? 'bg-[#EEF5EE] text-[#355E3B]' 
          : 'text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F7F8FA]'
        }
      `}
    >
      {children}
    </Link>
  );
}
