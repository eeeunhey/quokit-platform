import Link from 'next/link';
import { Star, GitFork, ArrowUpRight } from 'lucide-react';
import { TrendingRepository } from '@/types';
import { formatCompactNumber } from '@/lib/utils';
import { LANGUAGE_COLORS } from '@/lib/constants';

interface Props {
  repo: TrendingRepository;
  rank: number;
  sortBy: 'stars' | 'forks';
}

export function RepoRow({ repo, rank, sortBy }: Props) {
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#8b949e' : null;
  const primaryMetric = sortBy === 'stars' ? repo.stars_count : repo.forks_count;
  const secondaryMetric = sortBy === 'stars' ? repo.forks_count : repo.stars_count;

  return (
    <Link
      href={`/repo/${repo.owner_login}/${repo.name}`}
      className="group surface-card flex items-center gap-4 px-5 py-4 animate-in"
    >
      {/* Rank */}
      <span className="w-6 text-center text-sm font-semibold text-text-tertiary data-num shrink-0">
        {rank}
      </span>

      {/* Language dot */}
      {langColor && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: langColor }}
          title={repo.language || ''}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-text-tertiary">{repo.owner_login}</span>
          <span className="text-xs text-text-tertiary">/</span>
          <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
            {repo.name}
          </span>
          {repo.language && (
            <span className="hidden sm:inline text-xs text-text-tertiary px-1.5 py-0.5 bg-surface-active rounded">
              {repo.language}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary truncate max-w-2xl">
          {repo.description_ko || repo.description || '설명이 제공되지 않았습니다.'}
        </p>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-5 shrink-0">
        {/* Primary metric */}
        <div className={`flex items-center gap-1.5 ${sortBy === 'stars' ? 'text-star' : 'text-fork'}`}>
          {sortBy === 'stars' ? <Star className="w-4 h-4" /> : <GitFork className="w-4 h-4" />}
          <span className="text-sm font-bold data-num">{formatCompactNumber(primaryMetric)}</span>
        </div>

        {/* Secondary metric */}
        <div className="flex items-center gap-1 text-text-tertiary">
          {sortBy === 'stars' ? <GitFork className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          <span className="text-xs data-num">{formatCompactNumber(secondaryMetric)}</span>
        </div>

        {/* Gained badge */}
        {repo.gained_stars > 0 && sortBy === 'stars' && (
          <span className="text-xs font-semibold text-success data-num">
            +{formatCompactNumber(repo.gained_stars)}
          </span>
        )}
      </div>

      {/* Mobile metrics */}
      <div className="flex sm:hidden items-center gap-1 shrink-0">
        <span className={`text-sm font-bold data-num ${sortBy === 'stars' ? 'text-star' : 'text-fork'}`}>
          {formatCompactNumber(primaryMetric)}
        </span>
      </div>

      {/* Arrow */}
      <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
    </Link>
  );
}
