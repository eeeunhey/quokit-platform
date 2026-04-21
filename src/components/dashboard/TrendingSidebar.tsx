import Link from 'next/link';
import { TrendingUp, Hash } from 'lucide-react';

interface TopicItem {
  rank: number;
  name: string;
  count: number;
}

/**
 * 글로벌 기술 트렌드 사이드바.
 *
 * GitHub Search API를 통해 최근 1년간 Stars 상위 100개 레포의
 * topics(태그)를 집계한 결과를 보여줍니다.
 *
 * 데이터 흐름:
 *   /api/topics (Redis 캐시 24h → GitHub Search API fallback)
 *   → 이 서버 컴포넌트에서 fetch → 렌더링
 *
 * DB 의존 없음. API만으로 동작합니다.
 */
export async function TrendingSidebar() {
  let topTags: TopicItem[] = [];

  try {
    // 서버 컴포넌트에서 내부 API를 호출할 때는 절대 URL이 필요합니다.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/topics`, {
      next: { revalidate: 86400 }, // ISR: 24시간마다 재검증
    });

    if (res.ok) {
      const json = await res.json();
      topTags = json.data || [];
    }
  } catch (error) {
    console.error('[TrendingSidebar] Failed to fetch topics:', error);
  }

  // API 실패 또는 데이터 없을 때 Fallback (UI가 깨지지 않도록)
  if (topTags.length === 0) {
    topTags = [
      { rank: 1, name: "react", count: 0 },
      { rank: 2, name: "machine-learning", count: 0 },
      { rank: 3, name: "typescript", count: 0 },
      { rank: 4, name: "python", count: 0 },
      { rank: 5, name: "nextjs", count: 0 },
    ];
  }

  return (
    <aside className="flex flex-col gap-5 sticky top-[106px] animate-in fade-in duration-500">

      {/* ====================================================
          메인 위젯: 글로벌 기술 트렌드 (GitHub API 기반, 1년)
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 & 기간 라벨 */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center bg-white justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-[#6F8F72]" />
            <h2 className="text-[15px] font-bold text-[#1F2937] tracking-tight">
              글로벌 기술 트렌드
            </h2>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#6F8F72] bg-[#EEF5EE] rounded-md">1 YEAR</span>
        </div>

        {/* 2) 카드 본문: 태그 리스트 */}
        <div className="flex flex-col bg-white">
          {topTags.map((item) => (
            <Link 
              key={item.name} 
              href={`https://github.com/topics/${item.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* 순위 표기 */}
                <span className={`text-[14px] font-bold w-4 text-center shrink-0 ${item.rank <= 3 ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`}>
                  {item.rank}
                </span>
                {/* 태그 아이콘 */}
                <Hash className="w-[14px] h-[14px] text-[#A7C4A0] shrink-0" />
                {/* 태그명 */}
                <span className="text-[14.5px] font-medium text-[#4B5563] group-hover:text-[#355E3B] truncate transition-colors">
                  {item.name}
                </span>
              </div>
              {/* 등장 횟수 */}
              <div className="text-[13px] font-medium text-[#9CA3AF] shrink-0 group-hover:text-[#6F8F72] transition-colors">
                {item.count > 0 ? `${item.count}회` : '—'}
              </div>
            </Link>
          ))}
        </div>

        {/* 3) 카드 하단: 안내 */}
        <div className="flex items-center justify-center gap-1 p-4 bg-[#F8FAF8] font-medium text-[12px] tracking-wide text-[#9CA3AF] border-t border-[#F3F4F6]">
          GitHub Stars 상위 100개 레포 기준
        </div>
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
