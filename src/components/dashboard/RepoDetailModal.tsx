'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  X, ExternalLink, Star, GitFork, Users,
  CalendarDays, GitCommit, AlertCircle, RefreshCw
} from 'lucide-react';
import { TrendingRepository } from '@/types';
import { formatCompactNumber, formatRelativeTime, stripMarkdown } from '@/lib/utils';
import { LANGUAGE_COLORS } from '@/lib/constants';
import { ActivityChart } from './ActivityChart';

/* ─────────────────────────────────────
   서버 프록시에서 가져오는 추가 정보 타입
───────────────────────────────────── */
interface GithubDetail {
  contributors_count: number;
  last_commit_at: string | null;
  last_commit_message: string | null;
  license_name: string | null;
  created_at: string;
  pushed_at: string;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
  readme_ko: string | null;
  readme_original: string | null;
  top_contributors?: { login: string; avatar_url: string }[];
  latest_release?: string | null;
  commit_activity?: { date: string; commits: number }[];
}

interface Props {
  repo: TrendingRepository;
  rank?: number;
  onClose: () => void;
}

export function RepoDetailModal({ repo, rank, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<GithubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [readmeLang, setReadmeLang] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    setMounted(true);
  }, []);

  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : null;

  /* ─── 외부 클릭 / ESC 닫기 ─── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden'; 
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  /* ─── 내부 프록시 API 호출 ─── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    async function fetchDetail() {
      try {
        const res = await fetch(`/api/repos/${repo.owner_login}/${repo.name}/detail`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        
        if (!json.success) throw new Error(json.error);
        const data = json.data;

        if (!cancelled) {
          setDetail(data);
        }
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => { cancelled = true; };
  }, [repo.owner_login, repo.name, repo.stars_count, repo.gained_stars]);

  if (!mounted) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
      onClick={(e) => { 
        e.stopPropagation();
        if (e.target === overlayRef.current) onClose(); 
      }}
    >
      <div
        className="relative w-full max-w-5xl bg-surface rounded-2xl border border-line
                   shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <div className="absolute top-5 right-5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl bg-surface-active/50 hover:bg-surface-active text-text-secondary hover:text-text-primary transition-colors backdrop-blur-md"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 스크롤 본문 영역 ─── */}
        <div className="flex-1 overflow-y-auto customized-scrollbar p-6 sm:p-10 relative">
          
          {/* Top Badges & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8 pr-12 border-b border-line pb-6">
            {rank && (
              <div className="inline-flex items-center gap-3 border border-accent/20 bg-accent/5 px-4 py-2.5 rounded-2xl">
                 <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                   <span className="text-xl font-black text-accent data-num">{rank}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-accent/80 uppercase tracking-wider">GitHub Trending</span>
                   <span className="text-sm font-bold text-accent">Repository Of The Day</span>
                 </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <a href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-text-primary text-bg font-bold text-xs hover:opacity-90 transition shadow-sm">
                <ExternalLink className="w-4 h-4" />
                Visit GitHub
              </a>
            </div>
          </div>
          
          {/* Title & Tags */}
          <div className="mb-5">
            <h1 className="text-3xl sm:text-4xl font-bold text-accent tracking-tighter break-all font-mono">
              {repo.full_name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-4">
              {(repo.topics as string[] || []).map(t => (
                <span key={t} className="px-2.5 py-1 text-xs font-semibold text-text-tertiary bg-surface-active/50 rounded-lg border border-line">
                  # {t}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <p className="text-[15px] sm:text-base text-text-secondary leading-relaxed mb-6 font-sans break-keep">
            {repo.description_ko || repo.description || '설명이 제공되지 않았습니다.'}
          </p>

          {/* 인라인 메타데이터 바 (GitTrend Style) */}
          <div className="mb-10 flex flex-col gap-2 p-5 rounded-2xl border border-line bg-surface-active/10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-border-line-hover" />
             <div className="text-[10px] sm:text-xs font-medium text-text-tertiary flex items-center gap-1.5 mb-1.5 opacity-80">
               <RefreshCw className="w-3.5 h-3.5" />
               데이터 동기화 기준: {formatRelativeTime(String(repo.last_fetched_at || repo.created_at))}
             </div>
             
             <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs sm:text-sm font-semibold text-text-secondary">
               {repo.language && (
                 <span className="flex items-center gap-1.5 text-text-primary shadow-sm px-2 py-0.5 rounded-md border border-line bg-surface">
                   <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: langColor || '#888'}} />
                   {repo.language}
                 </span>
               )}
               <span className="flex items-center gap-1"><Star className="w-4 h-4 text-star" /> <span className="data-num text-text-primary">{formatCompactNumber(repo.stars_count)}</span></span>
               <span className="flex items-center gap-1"><GitFork className="w-4 h-4 text-fork" /> <span className="data-num text-text-primary">{formatCompactNumber(repo.forks_count)}</span></span>
               <span className="flex items-center gap-1.5">
                 <Users className="w-4 h-4 text-accent" /> 
                 {detail?.top_contributors && detail.top_contributors.length > 0 && (
                   <div className="flex -space-x-1.5 mr-1">
                     {detail.top_contributors.map(c => (
                       <img key={c.login} src={c.avatar_url} alt={c.login} title={c.login} className="w-4 h-4 rounded-full border border-surface bg-surface-active" />
                     ))}
                   </div>
                 )}
                 <span className="data-num text-text-primary">{detail?.contributors_count || '...'}</span> contributors
               </span>
               <span className="flex items-center gap-1"><GitCommit className="w-4 h-4" /> last commit <span className="data-num text-text-primary">{detail?.last_commit_at ? formatRelativeTime(detail.last_commit_at) : '...'}</span></span>
               {detail?.latest_release && (
                 <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
                   🏷️ {detail.latest_release}
                 </span>
               )}
               {repo.homepage && (
                  <a href={repo.homepage} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent hover:underline"><ExternalLink className="w-3.5 h-3.5" /> website</a>
               )}
             </div>

             {error && (
              <div className="mt-3 text-xs text-warning flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                일부 실시간 갱신 정보를 불러오지 못했습니다.
              </div>
            )}
          </div>

          {/* =========================================
              한글 README 뷰어 (문서 뷰어 스타일, 원문 토글)
              ========================================= */}
          {!loading && (detail?.readme_ko || detail?.readme_original) && (
            <div className="mb-12 w-full rounded-2xl border border-line bg-surface shadow-sm overflow-hidden flex flex-col">
              
              {/* 상단 툴바 / 언어 토글 */}
              <div className="px-5 py-3.5 border-b border-line bg-surface-active/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <span className="text-base">📜</span> 한글 README
                  </h3>
                  <p className="text-[11px] text-text-tertiary mt-0.5 tracking-tight">
                    원문 구조를 유지한 채 한국어로 번역된 README입니다.
                  </p>
                </div>
                
                <div className="flex bg-surface-active/20 p-1 rounded-lg border border-line/50">
                  <button
                    onClick={() => setReadmeLang('ko')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      readmeLang === 'ko' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => setReadmeLang('en')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      readmeLang === 'en' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    원문
                  </button>
                </div>
              </div>

              {/* 문서 본문 */}
              <div className="p-6 sm:p-10 lg:px-14 max-h-[750px] overflow-y-auto customized-scrollbar">
                <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed font-sans
                  prose-headings:font-bold prose-headings:text-text-primary prose-heading:tracking-tight
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  prose-pre:bg-surface-active/10 prose-pre:border prose-pre:border-line prose-pre:rounded-xl prose-pre:shadow-sm
                  prose-code:text-accent/90 prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium
                  prose-blockquote:border-l-4 prose-blockquote:border-line prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-text-tertiary
                  prose-table:border prose-table:border-line prose-th:bg-surface-active/10 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-line
                  overflow-x-auto w-full">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {readmeLang === 'ko' 
                      ? (detail.readme_ko || '').replace(/<img[^>]*>/gi, '') // 깨진 이미지 안전하게 차단
                      : (detail.readme_original || '')
                    }
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          )}

          {/* 차트 영역 (가짜 데이터 대신 진짜 14주 커밋 펄스 연결) */}
          {!loading && !error && detail?.commit_activity && detail.commit_activity.length > 0 && (
            <div className="pt-8 border-t border-line">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-text-primary">실시간 커밋 생존 지표 (Pulse)</h3>
                  <p className="text-xs text-text-tertiary mt-1">최근 14주간의 프로젝트 커밋 활동량</p>
                </div>
              </div>
              <ActivityChart data={detail.commit_activity} />
            </div>
          )}
          
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

