import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

/**
 * 사이드바 — 글로벌 기술 트렌드 위젯 제거 후 광고 + 사이트 소개만 유지
 */
export function TrendingSidebar() {
  return (
    <aside className="flex flex-col gap-5 animate-in fade-in duration-500">

      {/* 광고 영역 — AdSense 자연 삽입 (광고가 로드되기 전까지는 투명한 공간만 차지) */}
      <div
        className="min-h-[250px] w-full"
        id="sidebar-ad-slot"
        aria-hidden="true"
      />

      {/* QUOK-IT 소개 */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#6F8F72]" />
          <h3 className="text-[13px] font-semibold text-[#1F2937] tracking-tight">QUOK-IT 소개</h3>
        </div>
        <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">
          오픈소스 트렌드를 한국어로 큐레이션하고 번역합니다. 실용적인 레포지토리를 빠르게 찾아보세요.
        </p>
        <div className="flex bg-[#F8FAF8] rounded-[10px] p-1 border border-[#E8ECE8]/50">
          <Link
            href="/about"
            className="flex-1 text-center py-2 text-[12px] font-semibold text-[#6F8F72] hover:text-[#355E3B] transition-colors"
          >
            자세히 알아보기
          </Link>
        </div>
      </div>

    </aside>
  );
}
