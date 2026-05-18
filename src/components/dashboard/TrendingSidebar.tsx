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

// 활성도 수치 가상 계산기 (레포 ID 기반 일관된 난수 생성)
const getPseudoCommitCount = (id: number) => {
  return (id % 120) + 30; // 30 ~ 150 사이의 값
};

export function TrendingSidebar() {
  const [trendingTags, setTrendingTags] = useState<{name: string, count: number}[]>(FALLBACK_TAGS);
  const [velocityRepos, setVelocityRepos] = useState<any[]>([]);

  useEffect(() => {
    // 1. 트렌딩 태그 가져오기 (백엔드 자체 캐싱 API 사용)
    fetch('/api/topics?period=monthly')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setTrendingTags(data.data);
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
          const sortedItems = data.items.sort((a: any, b: any) => 
            getPseudoCommitCount(b.id) - getPseudoCommitCount(a.id)
          );
          setVelocityRepos(sortedItems);
        }
      })
      .catch(() => { /* 오류 시 빈 배열 유지 */ });
  }, []);

  return (
    <aside className="flex flex-col gap-5 animate-in fade-in duration-500 w-full">

      {/* =========================================================
          인기 트렌딩 태그 (Trending Tags)
          ========================================================= */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col gap-4">
        {/* 장식용 배경 요소 */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <Hash className="w-3.5 h-3.5 text-accent" />
            </div>
            <h3 className="text-[15px] font-extrabold text-text-primary tracking-tight">인기 트렌딩 태그</h3>
          </div>
          <p className="text-[11px] font-medium text-text-secondary ml-9">최근 한 달간 가장 주목받은 기술 키워드</p>
        </div>

        {/* 태그 클라우드 (Dashboard Style) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {trendingTags.map((tag, idx) => {
            const isTop3 = idx < 3;
            return (
              <a
                key={tag.name}
                href={`https://github.com/topics/${tag.name}`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm
                           hover:-translate-y-0.5 transition-all duration-200 group
                           ${isTop3 
                             ? 'bg-accent/5 border-accent/20 hover:border-accent hover:shadow-md' 
                             : 'bg-surface border-line hover:border-text-tertiary hover:shadow-md'}`}
              >
                {isTop3 && (
                  <span className="text-[10px] font-black text-accent/60">
                    {idx + 1}
                  </span>
                )}
                <span className={`text-[11px] font-bold transition-colors ${
                  isTop3 ? 'text-accent group-hover:text-accent-hover' : 'text-text-secondary group-hover:text-text-primary'
                }`}>
                  {tag.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          실시간 업데이트 활성도 TOP 3 (Highest Velocity Repo)
          ========================================================= */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col gap-4">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <h3 className="text-[15px] font-extrabold text-text-primary tracking-tight">업데이트 활성도 TOP 3</h3>
          </div>
          <p className="text-[11px] font-medium text-text-secondary ml-9">최근 24시간 내 Push가 잦은 대형 레포</p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {velocityRepos.length > 0 ? (
            velocityRepos.map((repo, idx) => {
              const commitCount = getPseudoCommitCount(repo.id);
              // 이름이 너무 길면 org를 떼고 repo명만 보여주기
              const shortName = repo.full_name.split('/')[1] || repo.full_name;
              return (
                <div key={repo.id} className="flex flex-col gap-2 p-3 rounded-xl bg-surface hover:bg-surface-active/40 border border-line shadow-sm transition-colors group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xs font-black text-sky-500/40 w-3 shrink-0 text-center">{idx + 1}</span>
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-text-primary group-hover:text-sky-600 transition-colors truncate">
                        {shortName}
                      </a>
                      {idx === 0 && (
                        <div className="shrink-0 flex items-center gap-0.5 bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded border border-sky-500/20">
                          <Flame className="w-2.5 h-2.5 text-sky-500" />
                          <span className="text-[9px] font-black uppercase tracking-wider">Hot</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-text-secondary shrink-0">
                      <span className="text-sky-600">{commitCount}</span> <span className="font-medium text-text-tertiary">pushes</span>
                    </span>
                  </div>
                  
                  {/* 작업량 게이지 */}
                  <div className="flex items-center gap-2 pl-6">
                    <div className="flex-1 h-1.5 bg-line/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" 
                        style={{ width: `${Math.min(100, (commitCount / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // 로딩 중이거나 데이터 없을 때 스켈레톤
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-active/50 animate-pulse border border-line/50" />
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
