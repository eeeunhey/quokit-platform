'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, Hash, Star, ExternalLink } from 'lucide-react';

type TopicPeriod = 'weekly' | 'monthly' | 'yearly';

interface TopicItem {
  rank: number;
  name: string;
  count: number;
  totalStars: number;
}

const PERIOD_TABS: { value: TopicPeriod; label: string; shortLabel: string }[] = [
  { value: 'weekly', label: '주간', shortLabel: 'WEEK' },
  { value: 'monthly', label: '월간', shortLabel: 'MONTH' },
  { value: 'yearly', label: '1년', shortLabel: 'YEAR' },
];

/**
 * Star 수를 1.4k, 23.5k, 1.2M 형식으로 포맷합니다.
 */
function formatStars(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) {
    const k = num / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  const m = num / 1_000_000;
  return `${m.toFixed(1)}M`;
}

/**
 * 초기 데이터를 빠르게 보여주기 위한 정적 Fallback
 * (API 응답이 오기 전까지 UI가 비어 보이지 않도록)
 */
const STATIC_FALLBACK: TopicItem[] = [
  { rank: 1, name: 'react', count: 0, totalStars: 0 },
  { rank: 2, name: 'machine-learning', count: 0, totalStars: 0 },
  { rank: 3, name: 'typescript', count: 0, totalStars: 0 },
  { rank: 4, name: 'python', count: 0, totalStars: 0 },
  { rank: 5, name: 'nextjs', count: 0, totalStars: 0 },
  { rank: 6, name: 'rust', count: 0, totalStars: 0 },
  { rank: 7, name: 'ai', count: 0, totalStars: 0 },
  { rank: 8, name: 'docker', count: 0, totalStars: 0 },
  { rank: 9, name: 'golang', count: 0, totalStars: 0 },
  { rank: 10, name: 'kubernetes', count: 0, totalStars: 0 },
];

/**
 * 글로벌 기술 트렌드 위젯 (사이드바)
 *
 * 주간 / 월간 / 1년 기간별 탭으로 GitHub 트렌딩 토픽 Top 10을 보여줍니다.
 * 각 토픽에 대해 Star 합계를 1.4k 형식으로 표기합니다.
 *
 * 성능 최적화:
 *   - 클라이언트 컴포넌트로 전환하여 SSR 블로킹 제거 (메인 페이지 렌더링 차단 없음)
 *   - Skeleton UI 즉시 표시 → API 응답 후 데이터 교체 (TTFB 체감 최소화)
 *   - 기간별 데이터 로컬 캐시 (탭 전환 시 재요청 없음)
 */
export function TrendingSidebar() {
  const [period, setPeriod] = useState<TopicPeriod>('weekly');
  const [topics, setTopics] = useState<TopicItem[]>(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 기간별 데이터를 로컬에 캐싱하여 탭 전환 시 재요청 방지
  const [cache, setCache] = useState<Partial<Record<TopicPeriod, TopicItem[]>>>({});

  const fetchTopics = useCallback(async (p: TopicPeriod) => {
    // 로컬 캐시 히트
    if (cache[p]) {
      setTopics(cache[p]!);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res = await fetch(`/api/topics?period=${p}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const data: TopicItem[] = json.data || [];

      if (data.length > 0) {
        setTopics(data);
        setCache(prev => ({ ...prev, [p]: data }));
      } else {
        setTopics(STATIC_FALLBACK);
      }
    } catch {
      setError(true);
      // 에러 시 기존 데이터 유지 (빈 화면 방지)
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    fetchTopics(period);
  }, [period, fetchTopics]);

  const handlePeriodChange = (p: TopicPeriod) => {
    setPeriod(p);
  };

  return (
    <aside className="flex flex-col gap-5 animate-in fade-in duration-500">

      {/* ====================================================
          메인 위젯: 글로벌 기술 트렌드 (GitHub API 기반)
          ==================================================== */}
      <div className="bg-white border border-[#E8ECE8] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        
        {/* 1) 카드 상단: 타이틀 + 기간 탭 */}
        <div className="px-5 pt-5 pb-0 bg-white">
          <div className="flex items-center gap-2 mb-3.5">
            <TrendingUp className="w-[18px] h-[18px] text-[#6F8F72]" />
            <h2 className="text-[15px] font-bold text-[#1F2937] tracking-tight">
              글로벌 기술 트렌드
            </h2>
          </div>

          {/* 기간 탭 — 주간 / 월간 / 1년 */}
          <div className="flex gap-1 p-1 bg-[#F3F5F3] rounded-xl mb-0">
            {PERIOD_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handlePeriodChange(value)}
                className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 cursor-pointer
                  ${period === value
                    ? 'bg-white text-[#355E3B] shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 2) 구분선 */}
        <div className="border-b border-[#F3F4F6]" />

        {/* 3) 카드 본문: 토픽 리스트 */}
        <div className="flex flex-col bg-white relative">
          {/* 로딩 오버레이 (기존 데이터 위에 반투명하게) */}
          {loading && topics !== STATIC_FALLBACK && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[#6F8F72] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Skeleton 로딩 (최초 로드 시) */}
          {loading && topics === STATIC_FALLBACK ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-4 h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="w-3.5 h-3.5 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" style={{ width: `${[80, 95, 70, 110, 85, 100, 75, 90, 105, 65][i]}px` }} />
                </div>
                <div className="h-4 w-10 bg-[#F3F4F6] rounded animate-pulse" />
              </div>
            ))
          ) : (
            topics.map((item) => (
              <Link
                key={item.name}
                href={`https://github.com/topics/${item.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between px-5 py-3 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* 순위 표기 */}
                  <span className={`text-[14px] font-bold w-5 text-center shrink-0 ${item.rank <= 3 ? 'text-[#6F8F72]' : 'text-[#9CA3AF]'}`}>
                    {item.rank}
                  </span>
                  {/* 태그 아이콘 */}
                  <Hash className="w-[14px] h-[14px] text-[#A7C4A0] shrink-0" />
                  {/* 태그명 */}
                  <span className="text-[14px] font-medium text-[#4B5563] group-hover:text-[#355E3B] truncate transition-colors">
                    {item.name}
                  </span>
                </div>

                {/* Star 수 — 1.4k 형식 */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.totalStars > 0 ? (
                    <>
                      <Star className="w-3 h-3 text-[#D4A843] fill-[#D4A843]" />
                      <span className="text-[13px] font-semibold text-[#B8860B] tabular-nums tracking-tight group-hover:text-[#996600] transition-colors">
                        {formatStars(item.totalStars)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#D1D5DB]">—</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 4) 카드 하단: GitHub Topics 페이지 링크 */}
        {error ? (
          <div className="flex items-center justify-center gap-1.5 p-3.5 bg-[#F8FAF8] font-medium text-[11px] tracking-wide text-[#9CA3AF] border-t border-[#F3F4F6]">
            <span className="text-[#EF4444]">데이터 로드 실패 — 잠시 후 재시도</span>
          </div>
        ) : (
          <Link
            href="https://github.com/topics"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 p-3.5 bg-[#F8FAF8] font-medium text-[11px] tracking-wide text-[#9CA3AF] border-t border-[#F3F4F6] hover:bg-[#EEF5EE] hover:text-[#6F8F72] transition-colors cursor-pointer group/footer"
          >
            <span>GitHub Topics 더보기</span>
            <span className="text-[#D1D5DB]">·</span>
            <span className="uppercase font-bold text-[#6F8F72]">
              {PERIOD_TABS.find(t => t.value === period)?.shortLabel}
            </span>
            <ExternalLink className="w-3 h-3 text-[#9CA3AF] group-hover/footer:text-[#6F8F72] transition-colors ml-0.5" />
          </Link>
        )}
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
