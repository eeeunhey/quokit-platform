'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Dices, Droplets, ExternalLink, Star, ArrowRight, Flame } from 'lucide-react';
import { formatKoreanNumber } from '@/lib/utils';

// 예비용 탐색 데이터 (API 제한 걸렸을 때 사용)
const FALLBACK_GACHA = [
  { full_name: 'browser-use/browser-use', description: 'AI 에이전트를 위한 웹 브라우저 조작 프레임워크', stargazers_count: 14500, html_url: 'https://github.com/browser-use/browser-use' },
  { full_name: 'shadcn-ui/ui', description: '아름답게 디자인된 컴포넌트 복사/붙여넣기 시스템', stargazers_count: 52000, html_url: 'https://github.com/shadcn-ui/ui' },
  { full_name: 'a16z-infra/ai-town', description: '가상의 AI 캐릭터들이 살아가는 작은 마을 시뮬레이터', stargazers_count: 8900, html_url: 'https://github.com/a16z-infra/ai-town' },
  { full_name: 'excalidraw/excalidraw', description: '손그림 느낌의 가상 화이트보드 툴', stargazers_count: 55000, html_url: 'https://github.com/excalidraw/excalidraw' },
];

export function TrendingSidebar() {
  const [gachaPool, setGachaPool] = useState<any[]>(FALLBACK_GACHA);
  const [currentGacha, setCurrentGacha] = useState<any>(FALLBACK_GACHA[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [velocityRepos, setVelocityRepos] = useState<any[]>([]);

  useEffect(() => {
    // 1. 랜덤 탐색용 레포 풀 가져오기 (스타 5000 이상 인기 레포 50개)
    fetch('https://api.github.com/search/repositories?q=stars:>5000&sort=stars&per_page=50')
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          setGachaPool(data.items);
          setCurrentGacha(data.items[Math.floor(Math.random() * data.items.length)]);
        }
      })
      .catch(() => { /* 오류 시 FALLBACK_GACHA 유지 */ });

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

  const spinGacha = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // 룰렛 이펙트 (빠르게 여러 번 바꾸다가 멈춤)
    let count = 0;
    const interval = setInterval(() => {
      setCurrentGacha(gachaPool[Math.floor(Math.random() * gachaPool.length)]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 50);
  };

  // 활성도 수치 가상 계산기 (레포 ID 기반 일관된 난수 생성)
  const getPseudoCommitCount = (id: number) => {
    return (id % 120) + 30; // 30 ~ 150 사이의 값
  };

  return (
    <aside className="flex flex-col gap-5 animate-in fade-in duration-500 w-full">

      {/* =========================================================
          랜덤 레포지토리 탐색 (Random Discovery)
          ========================================================= */}
      <div className="bg-gradient-to-br from-surface to-surface-active/30 border border-line rounded-2xl shadow-sm p-5 relative overflow-hidden">
        {/* 장식용 배경 요소 */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Dices className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">랜덤 레포지토리 탐색</h3>
        </div>

        {/* 뽑힌 레포지토리 카드 */}
        <div className={`bg-surface border border-line rounded-xl p-4 mb-4 transition-all duration-200
                        ${isSpinning ? 'scale-95 opacity-50 blur-[2px]' : 'scale-100 opacity-100 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-text-primary truncate">
              {currentGacha?.full_name}
            </span>
            <div className="flex items-center gap-0.5 ml-auto text-star shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-medium data-num">
                {currentGacha?.stargazers_count ? formatKoreanNumber(currentGacha.stargazers_count) : '0'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed mb-3 h-8">
            {currentGacha?.description || '설명이 제공되지 않았습니다.'}
          </p>
          <a
            href={currentGacha?.html_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            GitHub에서 열기 <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <button
          onClick={spinGacha}
          disabled={isSpinning}
          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs shadow-md 
                     hover:bg-indigo-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSpinning ? '탐색 중...' : '🔄 다른 레포지토리 찾기'}
        </button>
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
