'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, GitFork, TrendingUp, ChevronDown, ExternalLink,
  BookOpen, Tag, Target, Zap, BarChart2, Clock
} from 'lucide-react';
import { TrendingRepository } from '@/types';
import { formatKoreanNumber, formatRelativeTime, stripMarkdown } from '@/lib/utils';
import { LANGUAGE_COLORS } from '@/lib/constants';
import { RepoDetailModal } from './RepoDetailModal';

interface Props {
  repo: TrendingRepository;
  rank: number;
  sortBy: 'stars' | 'forks';
}

// 태그를 생성하는 함수 (topics 기반)
function generateTags(repo: TrendingRepository): string[] {
  const tags: string[] = [];
  if (repo.language) tags.push(repo.language);
  const topics = (repo.topics as string[] | undefined) || [];
  // 핵심 토픽만 최대 4개
  tags.push(...topics.slice(0, 4));
  return [...new Set(tags)].slice(0, 5);
}

// "왜 뜨는지" 간단 생성 로직은 실제 요약 데이터(summary_ko)로 대체되어 삭제됨

export function RepoKoreanCard({ repo, rank, sortBy }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || '#8b949e') : null;
  const tags = generateTags(repo);
  const primaryCount = sortBy === 'stars' ? repo.stars_count : repo.forks_count;
  const primaryLabel = sortBy === 'stars' ? '스타' : '포크';
  
  // 한글 제목: description_ko에서 첫 문장 추출하거나 name 사용
  const koreanTitle = repo.name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // 하단 박스에 들어갈 GitHub About 번역본 (이전 버그로 인해 영어 원문이 DB에 저장된 경우도 처리)
  const isTranslated = repo.description_ko && repo.description_ko !== repo.description;
  const githubAboutKo = isTranslated
    ? stripMarkdown(repo.description_ko!)
    : repo.description
      ? `🌐 ${stripMarkdown(repo.description)}\n(한국어 번역이 곧 제공됩니다)`
      : 'GitHub 소개 내용이 아직 없습니다.';

  // 굵은 글씨(제목 대체)로 사용할 한국어 요약 (summary_ko의 첫 문장)
  let koreanHeadline = '';
  if (repo.summary_ko) {
    koreanHeadline = repo.summary_ko.split(/\|분할\||\n/)[0].replace(/^[-*•]\s*/, '').trim();
    koreanHeadline = stripMarkdown(koreanHeadline);
  }
  if (!koreanHeadline) {
    koreanHeadline = koreanTitle + ' - ' + (isTranslated ? stripMarkdown(repo.description_ko!.slice(0, 30)) : '설명 준비 중');
  }

  return (
    <Link href={`/repo/${repo.owner_login}/${repo.name}`} className="block">
      <article
        className="surface-card overflow-hidden group animate-in cursor-pointer hover:border-line-hover transition-colors"
      >
      {/* ======= 기본 펼침 영역 (항상 노출) ======= */}
      <div className="px-5 pt-5 pb-4">
        
        {/* 상단 헤더 행 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 랭킹 */}
          <div className="shrink-0 w-8 h-8 flex items-center justify-center
                          rounded-lg bg-surface-active text-xs font-bold text-text-tertiary data-num">
            {rank}
          </div>

          {/* 오너 아바타 */}
          {repo.owner_avatar_url && (
            <img
              src={repo.owner_avatar_url}
              alt={repo.owner_login}
              className="shrink-0 w-8 h-8 rounded-lg border border-line"
            />
          )}

          {/* 제목 + 원본 경로 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className="text-base font-bold text-text-primary leading-snug group-hover:text-accent transition-colors"
              >
                {koreanTitle}
              </span>
              {/* 언어 닷 */}
              {langColor && (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0 translate-y-0.5"
                  style={{ backgroundColor: langColor }}
                  title={repo.language || ''}
                />
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 font-mono">
              {repo.owner_login}/{repo.name}
            </p>
          </div>

          {/* 핵심 수치 (우측) */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-1.5 ${sortBy === 'stars' ? 'text-star' : 'text-fork'}`}>
              {sortBy === 'stars'
                ? <Star className="w-4 h-4" />
                : <GitFork className="w-4 h-4" />
              }
              <span className="text-base font-bold data-num">{formatKoreanNumber(primaryCount)}</span>
              <span className="text-xs text-text-tertiary">{primaryLabel}</span>
            </div>
            {repo.gained_stars > 0 && sortBy === 'stars' && (
              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span className="data-num">+{formatKoreanNumber(repo.gained_stars)} 오늘</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 제목을 대신하는 한글 핵심 요약 (굵은 글씨) ─── */}
        <p className="text-sm font-semibold text-text-primary mb-3 leading-snug break-keep">
          {koreanHeadline.length > 80 ? koreanHeadline.slice(0, 80) + '…' : koreanHeadline}
        </p>

        {/* ─── GitHub About 번역본 (박스) ─── */}
        <div className="mb-4 px-4 py-3 bg-surface-active/30 rounded-xl border border-line text-xs text-text-secondary leading-relaxed break-keep">
          {githubAboutKo}
        </div>

        {/* ─── 태그 ─── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <span key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium
                           text-text-secondary bg-surface-active rounded-md border border-line">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ─── 보조 수치 행 (Stars · Forks · 갱신 시각) ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 
                          bg-amber-500/8 border border-amber-500/15 rounded-lg">
            <Star className="w-3.5 h-3.5 text-star" />
            <span className="text-xs font-semibold text-star data-num">{formatKoreanNumber(repo.stars_count)}</span>
            <span className="text-[10px] text-text-tertiary">Stars</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 
                          bg-blue-500/8 border border-blue-500/15 rounded-lg">
            <GitFork className="w-3.5 h-3.5 text-fork" />
            <span className="text-xs font-semibold text-fork data-num">{formatKoreanNumber(repo.forks_count)}</span>
            <span className="text-[10px] text-text-tertiary">Forks</span>
          </div>
          {repo.last_fetched_at && (
            <div className="inline-flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary ml-auto">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(String(repo.last_fetched_at))}</span>
            </div>
          )}
        </div>

        {/* ─── 빠른 액션 버튼 ─── */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       text-text-secondary border border-line rounded-lg
                       hover:border-line-hover hover:bg-surface-hover transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            GitHub
          </a>
          {repo.homepage && (
            <a
              href={repo.homepage}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         text-text-secondary border border-line rounded-lg
                         hover:border-line-hover transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              홈페이지
            </a>
          )}

          {/* 빠른 미리보기 (기존 모달) */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors ml-auto"
          >
            <Zap className="w-3 h-3" />
            빠른 미리보기
          </button>

          {/* 원본 정보 토글 */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDetailOpen(v => !v); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       text-text-tertiary hover:text-text-secondary hover:bg-surface-hover
                       rounded-lg transition-colors"
            aria-expanded={detailOpen}
          >
            원본 정보
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200
                                    ${detailOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ======= 접힘 영역 — 원본 GitHub 정보 아코디언 ======= */}
      <div
        className={`overflow-hidden transition-all duration-300
                    ${detailOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!detailOpen}
      >
        <div className="border-t border-line mx-5" />
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          <OriginalInfoItem label="원본 이름" value={repo.full_name} />
          {repo.description && (
            <div className="col-span-2 sm:col-span-3">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider block mb-1">
                원문 설명
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">{repo.description}</p>
            </div>
          )}
          {repo.language && (
            <OriginalInfoItem label="주 언어" value={repo.language}>
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: langColor || '#8b949e' }}
              />
            </OriginalInfoItem>
          )}
          <OriginalInfoItem
            label="Stars"
            value={`${formatKoreanNumber(repo.stars_count)}`}
            icon={<Star className="w-3 h-3 text-star" />}
          />
          <OriginalInfoItem
            label="Forks"
            value={`${formatKoreanNumber(repo.forks_count)}`}
            icon={<GitFork className="w-3 h-3 text-fork" />}
          />
          {repo.issues_count !== undefined && (
            <OriginalInfoItem label="Open Issues" value={`${formatKoreanNumber(repo.issues_count)}개`} />
          )}
          {repo.last_fetched_at && (
            <OriginalInfoItem
              label="마지막 확인"
              value={formatRelativeTime(String(repo.last_fetched_at))}
            />
          )}

          {/* GitHub 바로가기 */}
          <div className="col-span-2 sm:col-span-3 pt-2">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-accent hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {repo.html_url}
            </a>
          </div>
        </div>
      </div>

      {/* ======= 레포 상세 모달 ======= */}
      {modalOpen && (
        <RepoDetailModal repo={repo} rank={rank} onClose={() => setModalOpen(false)} />
      )}
      </article>
    </Link>
  );
}

function OriginalInfoItem({
  label, value, icon, children
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        {icon}
        {children}
        <span className="text-xs font-semibold text-text-primary data-num">{value}</span>
      </div>
    </div>
  );
}
