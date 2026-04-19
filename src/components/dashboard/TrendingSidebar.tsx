import prisma from '@/lib/db';
import Link from 'next/link';
import { Code2, ChevronRight, TrendingUp } from 'lucide-react';

export async function TrendingSidebar() {
  let topLanguages: { language: string; count: number }[] = [];

  try {
    // 최근 트렌딩 데이터에서 가장 많이 사용된 프로그래밍 언어 그룹화 및 카운트
    const langGroups = await prisma.repository.groupBy({
      by: ['language'],
      where: { language: { not: null } },
      _count: { language: true },
      orderBy: { _count: { language: 'desc' } },
      take: 10, // 상위 10개 언어
    });

    topLanguages = langGroups
      .filter(g => g.language)
      .map(g => ({ language: g.language!, count: g._count.language }));

  } catch (err) {
    console.error('[TrendingSidebar]', err);
  }

  return (
    <aside className="flex flex-col gap-5 sticky top-[106px]">

      {/* ====================================================
          메인 위젯: 많이 쓰이는 인기 언어 랭킹
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 & 기간 라벨 */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Code2 className="w-[18px] h-[18px] text-[#6F8F72]" />
            <h2 className="text-[15px] font-semibold text-[#1F2937] tracking-tight">많이 쓰는 언어 랭킹</h2>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#6F8F72] bg-[#EEF5EE] rounded-md">WEEKLY</span>
        </div>

        {/* 2) 카드 본문: 랭킹 리스트 영역 */}
        <div className="flex flex-col bg-white">
          {topLanguages.length > 0 ? (
            topLanguages.map((item, idx) => (
              <Link 
                key={item.language} 
                href={`/?language=${encodeURIComponent(item.language.toLowerCase())}`}
                className="group flex items-center justify-between px-5 py-3.5 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* 순위 표기 */}
                  <span className={`text-[14px] font-semibold font-mono w-4 text-center shrink-0 ${idx < 3 ? 'text-[#1F2937]' : 'text-[#D1D5DB]'}`}>
                    {idx + 1}
                  </span>
                  {/* 언어명 */}
                  <span className="text-[14.5px] font-medium text-[#4B5563] group-hover:text-[#1F2937] truncate transition-colors">
                    {item.language}
                  </span>
                </div>
                {/* 랭크 수치 (관련 레포 개수) */}
                <div className="text-[13px] font-mono font-semibold text-[#9CA3AF] group-hover:text-[#6F8F72] transition-colors shrink-0">
                  {item.count} Repos
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">
              언어 데이터를 수집 중입니다.
            </div>
          )}
        </div>

        {/* 3) 카드 하단: 전체 링크 */}
        <Link 
          href="/languages" 
          className="flex items-center justify-center gap-1.5 py-3.5 bg-[#F8FAF8] hover:bg-[#EEF5EE]/40 text-[13px] font-semibold text-[#6F8F72] transition-colors border-t border-[#F3F4F6]"
        >
          기술 스택 전체보기
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 광고 영역 — AdSense 자연 삽입 */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm p-4 min-h-[250px] flex items-center justify-center" id="sidebar-ad-slot" aria-label="광고">
        <p className="text-xs text-[#9CA3AF] text-center tracking-wide uppercase">Advertisement</p>
      </div>

      {/* 위젯 3: 이 사이트 소개 mini (톤 매너 일치) */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#6F8F72]" />
          <h3 className="text-[13px] font-semibold text-[#1F2937] tracking-tight">QUOK-IT 소개</h3>
        </div>
        <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">
          오픈소스 트렌드를 한국어로 큐레이션하고 번역합니다. 실용적인 레포지토리를 빠르게 찾아보세요.
        </p>
        <div className="flex bg-[#F8FAF8] rounded-[10px] p-1 border border-[#E8ECE8]/50">
          <Link href="/about" className="flex-1 text-center py-2 text-[12px] font-semibold text-[#6F8F72] hover:text-[#355E3B] transition-colors">
            자세히 알아보기
          </Link>
        </div>
      </div>

    </aside>
  );
}
