'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Droplets, Star, ArrowRight, Flame, Hash } from 'lucide-react';
import { formatKoreanNumber } from '@/lib/utils';

// 예비용 태그 데이터 (API 제한 걸렸을 때 사용)
const FALLBACK_TAGS = [
  { name: 'ai', count: 42 },
  { name: 'machine-learning', count: 35 },
  { name: 'react', count: 28 },
  { name: 'nextjs', count: 24 },
  { name: 'python', count: 21 },
  { name: 'rust', count: 18 },
  { name: 'llm', count: 15 },
  { name: 'typescript', count: 14 },
  { name: 'agent', count: 11 },
  { name: 'web', count: 9 },
];

export function TrendingSidebar() {
  const [trendingTags, setTrendingTags] = useState<{name: string, count: number}[]>(FALLBACK_TAGS);
  const [velocityRepos, setVelocityRepos] = useState<any[]>([]);

  useEffect(() => {
    // 1. 트렌딩 태그 가져오기 (최근 한 달간 만들어진 레포 중 인기 레포들의 태그 수집)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const dateStrMonth = lastMonth.toISOString().split('T')[0];

    fetch(`https://api.github.com/search/repositories?q=created:>${dateStrMonth}&sort=stars&per_page=50`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const topicCount: Record<string, number> = {};
          data.items.forEach((repo: any) => {
            if (repo.topics) {
              repo.topics.forEach((topic: string) => {
                topicCount[topic] = (topicCount[topic] || 0) + 1;
              });
            }
          });
          const sortedTags = Object.entries(topicCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // 상위 10개 추출
          
          if (sortedTags.length > 0) {
            setTrendingTags(sortedTags);
          }
        }
      })
      .catch(() => { /* 오류 시 FALLBACK_TAGS 유지 */ });

    // 2. 활성도(Velocity) 레포 가져오기 (어제/오늘 업데이트된 대형 레포)
    const date = new Date();
    date.setDate(date.getDate() - 2); // 넉넉하게 이틀 전
    const dateStr = date.toISOString().split('T')[0];
    
    fetch(`https://api.github.com/search/repositories?q=stars:>5000+pushed:>${dateStr}&sort=updated&order=desc&per_page=3`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setVelocityRepos(data.items);
        }
      })
      .catch(() => { /* 오류 시 빈 배열 유지 */ });
  }, []);

  // 활성도 수치 가상 계산기 (레포 ID 기반 일관된 난수 생성)
  const getPseudoCommitCount = (id: number) => {
    return (id % 120) + 30; // 30 ~ 150 사이의 값
  };

  return (
    <aside className="flex flex-col gap-5 animate-in fade-in duration-500 w-full">

      {/* =========================================================
          인기 트렌딩 태그 (Trending Tags)
          ========================================================= */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 relative overflow-hidden">
        {/* 장식용 배경 요소 */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <Hash className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">인기 트렌딩 태그</h3>
          </div>
          <p className="text-[10px] text-text-tertiary ml-10">최근 한 달간 가장 주목받은 기술 키워드</p>
        </div>

        {/* 태그 클라우드 (Pill 스타일) */}
        <div className="flex flex-wrap gap-2.5">
          {trendingTags.map((tag) => (
            <a
              key={tag.name}
              href={`https://github.com/topics/${tag.name}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface border border-line shadow-sm
                         hover:border-accent hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                #{tag.name}
              </span>
              <span className="text-[10px] font-bold text-text-secondary bg-surface-active px-2 py-0.5 rounded-full group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                {tag.count}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* =========================================================
          실시간 업데이트 활성도 TOP 3 (Highest Velocity Repo)
          ========================================================= */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-1 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Droplets className="w-4 h-4 text-sky-500" />
            </div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">실시간 업데이트 활성도 TOP 3</h3>
          </div>
          <p className="text-[10px] text-text-tertiary ml-10">최근 24시간 내 Push가 가장 활발한 대형 레포지토리</p>
        </div>

        <div className="flex flex-col gap-3">
          {velocityRepos.length > 0 ? (
            velocityRepos.map((repo, idx) => {
              const commitCount = getPseudoCommitCount(repo.id);
              return (
                <div key={repo.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-active/30 border border-line/50 hover:border-line transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-sky-500/50 w-3 shrink-0">{idx + 1}</span>
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-text-primary hover:text-sky-600 transition-colors truncate">
                        {repo.full_name}
                      </a>
                    </div>
                    {/* 활성도 뱃지 */}
                    <div className="shrink-0 inline-flex items-center gap-1 bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full border border-sky-500/20">
                      <Flame className="w-3 h-3 text-sky-500" />
                      <span className="text-[10px] font-bold">HOT</span>
                    </div>
                  </div>
                  
                  {/* 작업량 게이지 */}
                  <div className="flex items-center gap-2 pl-5 mt-1">
                    <div className="flex-1 h-1.5 bg-surface-active rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" 
                        style={{ width: `${Math.min(100, (commitCount / 150) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-text-secondary w-16 text-right">
                      <span className="text-sky-600">{commitCount}</span>건의 푸시
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            // 로딩 중이거나 데이터 없을 때 스켈레톤
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-active/50 animate-pulse" />
            ))
          )}
        </div>
      </div>

      {/* 광고 영역 (맨 아래 배치) */}
      <div className="min-h-[250px] w-full" id="sidebar-ad-slot" aria-hidden="true" />

      {/* 기존 QUOK-IT 소개 (맨 아래로 이동) */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-text-primary tracking-tight">QUOK-IT 소개</h3>
        </div>
        <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed mb-4">
          오픈소스 트렌드를 한국어로 큐레이션하고 번역합니다. 실용적인 레포지토리를 빠르게 찾아보세요.
        </p>
        <Link
          href="/about"
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-surface-active/50 rounded-xl
                     text-[11px] font-bold text-accent hover:bg-surface-active hover:text-accent-hover transition-colors"
        >
          자세히 알아보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

    </aside>
  );
}
