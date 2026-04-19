import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export async function TrendingSidebar() {
  // 전체 깃허브 기준 트렌딩 토픽
  const trendingTopics = [
    { rank: 1, topic: "AI 에이전트", search: "ai-agent", stars: "37.7k" },
    { rank: 2, topic: "AI 코딩 비서", search: "ai-coding-assistant", stars: "14.4k" },
    { rank: 3, topic: "셀프 호스팅", search: "self-hosted", stars: "11.1k" },
    { rank: 4, topic: "큐레이션 리스트", search: "curated-list", stars: "9.5k" },
    { rank: 5, topic: "AI 워크플로우", search: "ai-workflow", stars: "8.1k" },
    { rank: 6, topic: "워크플로우 자동화", search: "workflow-automation", stars: "6.0k" },
    { rank: 7, topic: "MCP (컨텍스트 프로토콜)", search: "mcp", stars: "4.0k" },
    { rank: 8, topic: "프록시 서버", search: "proxy", stars: "3.7k" },
    { rank: 9, topic: "AI 인프라", search: "ai-infrastructure", stars: "3.4k" },
    { rank: 10, topic: "로컬 LLM", search: "local-llm", stars: "3.4k" },
    { rank: 11, topic: "RAG (검색 증강 생성)", search: "rag", stars: "3.2k" },
  ];

  return (
    <aside className="flex flex-col gap-5 sticky top-[106px] animate-in fade-in duration-500">

      {/* ====================================================
          메인 위젯: 글로벌 트렌딩 토픽 (전체 깃허브 기준)
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 & 기간 라벨 */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center bg-white justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-[#6F8F72]" />
            <h2 className="text-[15px] font-bold text-[#1F2937] tracking-tight">
              뜨고 있는 토픽
            </h2>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#6F8F72] bg-[#EEF5EE] rounded-md">DAILY</span>
        </div>

        {/* 2) 카드 본문: 리스트 영역 */}
        <div className="flex flex-col bg-white">
          {trendingTopics.map((item) => (
            <Link 
              key={item.topic} 
              href={`https://github.com/topics/${item.search}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* 순위 표기 */}
                <span className={`text-[14px] font-bold w-4 text-center shrink-0 ${item.rank <= 3 ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`}>
                  {item.rank}
                </span>
                {/* 해시태그 */}
                <span className="text-[14px] text-[#A7C4A0] font-light">#</span>
                {/* 토픽명 */}
                <span className="text-[14.5px] font-medium text-[#4B5563] group-hover:text-[#355E3B] truncate transition-colors">
                  {item.topic}
                </span>
              </div>
              {/* 스탯 (별점) */}
              <div className="text-[13px] font-medium text-[#9CA3AF] shrink-0 group-hover:text-[#6F8F72] transition-colors">
                {item.stars}
              </div>
            </Link>
          ))}
        </div>

        {/* 3) 카드 하단: 전체보기 링크 */}
        <Link 
          href="https://github.com/topics" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 p-4 bg-[#F8FAF8] hover:bg-[#EEF5EE]/40 font-semibold text-[13px] tracking-wide text-[#6F8F72] transition-colors border-t border-[#F3F4F6]"
        >
          오픈소스 토픽 전체보기 →
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
