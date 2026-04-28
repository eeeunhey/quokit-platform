'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * 화면 우측 하단에 표시되는 스크롤 네비게이션 버튼
 * - ▲ 맨 위로 이동
 * - ▼ 맨 아래로 이동
 * 
 * 스크롤이 200px 이상 내려가면 표시됩니다.
 */
export function ScrollButtons() {
  const [visible, setVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      setVisible(scrollY > 200);
      setAtBottom(scrollY + windowH >= docH - 100);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div 
      className={`fixed right-5 bottom-6 z-50 flex flex-col gap-1.5 transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      {/* 맨 위로 */}
      <button
        onClick={scrollToTop}
        className="w-10 h-10 flex items-center justify-center rounded-full
                   bg-white/90 backdrop-blur-sm border border-[#E5E7EB] shadow-md
                   text-[#9CA3AF] hover:text-[#374151] hover:border-[#A7C4A0] hover:shadow-lg
                   transition-all duration-200 cursor-pointer"
        aria-label="맨 위로 이동"
        title="맨 위로"
      >
        <ChevronUp className="w-4.5 h-4.5" />
      </button>

      {/* 맨 아래로 */}
      <button
        onClick={scrollToBottom}
        className={`w-10 h-10 flex items-center justify-center rounded-full
                   bg-white/90 backdrop-blur-sm border border-[#E5E7EB] shadow-md
                   text-[#9CA3AF] hover:text-[#374151] hover:border-[#A7C4A0] hover:shadow-lg
                   transition-all duration-200 cursor-pointer
                   ${atBottom ? 'opacity-30 pointer-events-none' : ''}`}
        aria-label="맨 아래로 이동"
        title="맨 아래로"
      >
        <ChevronDown className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
