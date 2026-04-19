import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
import { Badge } from '@/components/ui/Badge';
import { LanguageBadge } from '@/components/ui/LanguageBadge';
import { StarCount } from '@/components/ui/StarCount';
import { TrendingRepository } from '@/types';

interface RepoCardProps {
  repo: TrendingRepository;
  period?: string;
}

export function RepoCard({ repo }: RepoCardProps) {
  // 요약 텍스트 배열화
  const summaries = repo.summary_ko 
    ? repo.summary_ko.split('\n').filter(s => s.trim().length > 0)
    : [];

  return (
    <Link href={`/repo/${repo.owner_login}/${repo.name}`} className="block h-full group">
      <div className="glass-card p-6 flex flex-col h-full hover:border-brand-500/50 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-theme-muted">#{repo.rank}</span>
              <h2 className="text-xl font-bold gradient-text decoration-brand-400 group-hover:underline">
                {repo.owner_login} / {repo.name}
              </h2>
            </div>
          </div>
          <div className="text-theme-muted group-hover:text-theme-text transition-colors p-1">
            <GithubIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Meta Stats Layer */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {repo.language && <LanguageBadge language={repo.language} />}
          <StarCount count={repo.stars_count} gained={repo.gained_stars} />
          {repo.forks_count > 0 && (
            <div className="text-sm text-theme-muted">
              <span className="font-semibold">{repo.forks_count}</span> forks
            </div>
          )}
        </div>

        {/* Description Layer */}
        <div className="mb-5 flex-grow">
          <p className="text-theme-text/90 font-medium mb-1">
            {repo.description_ko || repo.description || '설명이 제공되지 않았습니다.'}
          </p>
          
          {/* Gemini Summary Info */}
          {summaries.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-theme-text bg-theme-bg/50 p-4 rounded-xl border border-theme-border flex flex-col gap-1">
              {summaries.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5 whitespace-nowrap text-lg leading-none">✅</span>
                  <span className="leading-relaxed font-medium">{line.replace(/^• /g, '').replace(/^- /g, '')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-theme-border">
          <div className="flex flex-wrap gap-2">
            {repo.topics.slice(0, 3).map(topic => (
              <Badge key={topic} variant="default" size="sm">
                {topic}
              </Badge>
            ))}
            {repo.topics.length > 3 && (
              <span className="text-xs text-theme-muted flex items-center pl-1">
                +{repo.topics.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
