import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export async function TrendingSidebar() {
export async function TrendingSidebar() {
  // 전체 깃허브 기준 가장 많이 쓰이는 언어 (Global Top Languages)
  // 깃허브 전체의 거대한 트렌드를 기반으로 한 대표적인 언어 랭킹을 제공합니다.
  const trendingLanguages = [
    { rank: 1, name: "JavaScript", repos: "12M+" },
    { rank: 2, name: "Python", repos: "8.5M+" },
    { rank: 3, name: "TypeScript", repos: "5.2M+" },
    { rank: 4, name: "Java", repos: "4.8M+" },
    { rank: 5, name: "C#", repos: "3.5M+" },
    { rank: 6, name: "C++", repos: "3.2M+" },
    { rank: 7, name: "PHP", repos: "2.8M+" },
    { rank: 8, name: "Shell", repos: "2.5M+" },
    { rank: 9, name: "C", repos: "2.3M+" },
    { rank: 10, name: "Ruby", repos: "1.8M+" },
    { rank: 11, name: "Rust", repos: "1.5M+" },
    { rank: 12, name: "Go", repos: "1.2M+" },
    { rank: 13, name: "Swift", repos: "1.1M+" },
    { rank: 14, name: "Kotlin", repos: "950K+" },
    { rank: 15, name: "Dart", repos: "800K+" },
  ];

  return (
    <aside className="flex flex-col gap-5 sticky top-[106px] animate-in fade-in duration-500">

      {/* ====================================================
          메인 위젯: 글로벌 인기 언어 랭킹 (전체 깃허브 기준)
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 & 기간 라벨 */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center bg-white justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-[#6F8F72]" />
            <h2 className="text-[15px] font-bold text-[#1F2937] tracking-tight">
              많이 쓰는 깃허브 언어
            </h2>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#6F8F72] bg-[#EEF5EE] rounded-md">GLOBAL</span>
        </div>

        {/* 2) 카드 본문: 리스트 영역 */}
        <div className="flex flex-col bg-white">
          {trendingLanguages.map((item) => (
            <Link 
              key={item.name} 
              href={`https://github.com/topics/${item.name.toLowerCase().replace(/ /g, '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* 순위 표기 */}
                <span className={`text-[14px] font-bold w-4 text-center shrink-0 ${item.rank <= 3 ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`}>
                  {item.rank}
                </span>
                {/* 꺾쇠 아이콘 (언어 표시용) */}
                <span className="text-[14px] text-[#A7C4A0] font-light">{'</>'}</span>
                {/* 언어명 (영어로 고정) */}
                <span className="text-[14.5px] font-medium text-[#4B5563] group-hover:text-[#355E3B] truncate transition-colors">
                  {item.name}
                </span>
              </div>
              {/* 스탯 (레포 볼륨) */}
              <div className="text-[13px] font-medium text-[#9CA3AF] shrink-0 group-hover:text-[#6F8F72] transition-colors">
                {item.repos}
              </div>
            </Link>
          ))}
        </div>

        {/* 3) 카드 하단: 전체보기 링크 */}
        <Link 
          href="/languages" 
          className="flex items-center justify-center gap-1 p-4 bg-[#F8FAF8] hover:bg-[#EEF5EE]/40 font-semibold text-[13px] tracking-wide text-[#6F8F72] transition-colors border-t border-[#F3F4F6]"
        >
          로컬DB 언어 통계 (상세) →
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
