import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export async function TrendingSidebar() {
  // 전체 깃허브 기준 트렌딩 토픽 (데이터가 방대하여 실시간 집계가 어려우므로
  // 글로벌 트렌드를 기반으로 하는 대표적인 토픽 랭킹을 제공합니다)
  const trendingTopics = [
    { rank: 1, topic: "AI agent", stars: "37.7k" },
    { rank: 2, topic: "AI skills", stars: "14.4k" },
    { rank: 3, topic: "AI coding assistant", stars: "14.3k" },
    { rank: 4, topic: "Self-hosted", stars: "11.1k" },
    { rank: 5, topic: "Curated list", stars: "9.5k" },
    { rank: 6, topic: "AI workflow", stars: "8.1k" },
    { rank: 7, topic: "Workflow automation", stars: "6k" },
    { rank: 8, topic: "Programming examples", stars: "4.1k" },
    { rank: 9, topic: "MCP", stars: "4k" },
    { rank: 10, topic: "Proxy", stars: "3.7k" },
    { rank: 11, topic: "AI infrastructure", stars: "3.4k" },
    { rank: 12, topic: "Local LLM", stars: "3.4k" },
    { rank: 13, topic: "Audio processing", stars: "3.2k" },
    { rank: 14, topic: "Document processing", stars: "3.2k" },
    { rank: 15, topic: "RAG", stars: "3.2k" },
  ];

  return (
    <aside className="flex flex-col gap-5 sticky top-[106px] animate-in fade-in duration-500">

      {/* ====================================================
          메인 위젯: 글로벌 트렌딩 토픽 (전체 깃허브 기준)
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[6px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 & 기간 라벨 */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center bg-white">
          <h2 className="text-[13px] font-bold text-[#4B5563] tracking-wide uppercase">
            TRENDING <span className="text-[#D1D5DB] font-normal mx-1">//</span> <span className="text-[#9CA3AF] font-medium">DAILY</span>
          </h2>
        </div>

        {/* 2) 카드 본문: 리스트 영역 */}
        <div className="flex flex-col bg-white">
          {trendingTopics.map((item) => (
            <Link 
              key={item.topic} 
              href={`https://github.com/topics/${item.topic.toLowerCase().replace(/ /g, '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* 순위 표기 */}
                <span className={`text-[13px] font-semibold w-4 text-center shrink-0 ${item.rank <= 3 ? 'text-[#5569C6]' : 'text-[#9CA3AF]'}`}>
                  {item.rank}
                </span>
                {/* 해시태그 */}
                <span className="text-[14px] text-[#A7B1D0] font-light">#</span>
                {/* 토픽명 */}
                <span className="text-[15px] font-medium text-[#1F2937] group-hover:text-[#5569C6] truncate transition-colors">
                  {item.topic}
                </span>
              </div>
              {/* 스탯 (별점) */}
              <div className="text-[13px] font-medium text-[#9CA3AF] shrink-0">
                {item.stars} stars
              </div>
            </Link>
          ))}
        </div>

        {/* 3) 카드 하단: 전체보기 링크 */}
        <Link 
          href="https://github.com/topics" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-start gap-1 p-5 bg-white hover:bg-[#F9FAFB] font-bold text-[12px] tracking-wide text-[#4B5563] transition-colors border-t border-[#F3F4F6] uppercase"
        >
          BROWSE ALL TOPICS →
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
