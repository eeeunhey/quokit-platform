'use client';

import { useEffect, useState, useTransition } from 'react';
import { TrendingPeriod, ProgrammingLanguage, TrendingRepository } from '@/types';
import { RepoCard } from './RepoCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface RepoCardListProps {
  period: TrendingPeriod;
  language: ProgrammingLanguage;
}

export function RepoCardList({ period, language }: RepoCardListProps) {
  const [repos, setRepos] = useState<TrendingRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const res = await fetch(`/api/trending?period=${period}&language=${language}&per_page=20`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setRepos(json.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setRepos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [period, language]);

  if (loading) {
    return (
      <>
        {/* 통계 요약 바 스켈레톤 */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-48 bg-dark-card/50 rounded animate-pulse" />
          <div className="h-4 w-24 bg-dark-card/50 rounded animate-pulse" />
        </div>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton.Card key={i} />
          ))}
        </section>
      </>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg mb-2">데이터를 불러오지 못했습니다.</p>
        <p className="text-dark-muted text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* 통계 요약 바 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-dark-muted">
          {repos.length > 0
            ? `총 ${repos.length}개의 트렌딩 레포지토리`
            : '데이터를 불러오는 중입니다...'}
        </p>
        <span className="text-xs text-dark-muted/50">
          {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'} ·{' '}
          {language === 'all' ? '모든 언어' : language}
        </span>
      </div>

      {repos.length > 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {repos.map((repo: TrendingRepository) => (
            <RepoCard key={`${repo.full_name}-${repo.rank}`} repo={repo} />
          ))}
        </section>
      ) : (
        <div className="text-center py-12">
          <p className="text-dark-muted text-lg">트렌딩 데이터가 아직 수집되지 않았습니다.</p>
          <p className="text-dark-muted text-sm mt-2">잠시 후 다시 시도해 주세요.</p>
        </div>
      )}
    </>
  );
}
