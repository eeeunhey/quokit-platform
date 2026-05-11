import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Calendar, ChevronRight, Star } from 'lucide-react';
import prisma from '@/lib/db';
import { formatCompactNumber } from '@/lib/utils';

export const metadata: Metadata = {
  title: '오픈소스 주간 트렌드 리포트 | QUOK-IT',
  description: '매주 전 세계 오픈소스 커뮤니티에서 가장 주목받은 프로젝트를 분석하고 해설하는 주간 리포트입니다.',
};

async function getWeeklyReport() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  // 별표 수 기준으로 상위 15개 조회 (설명이 번역된 것 위주)
  const repos = await prisma.repository.findMany({
    where: {
      starsCount: { gt: 1000 },
      descriptionKo: { not: null },
    },
    orderBy: { starsCount: 'desc' },
    take: 15,
  });

  return repos;
}

export default async function WeeklyReportPage() {
  const repos = await getWeeklyReport();

  // 날짜 계산 (이번 주)
  const today = new Date();
  const weekString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${Math.ceil(today.getDate() / 7)}주차`;

  return (
    <div className="max-w-[800px] mx-auto px-6 py-16 animate-fade-in">
      {/* 헤더 */}
      <header className="mb-12">
        <div className="flex items-center gap-2 text-accent mb-4">
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">{weekString} 리포트</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-6">
          이번 주 글로벌 오픈소스<br />
          트렌드 분석
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed">
          한 주 동안 전 세계 수백만 명의 개발자들이 주목한 핵심 프로젝트들을 엄선하여 해설합니다. 
          빠르게 변하는 기술 스택과 새로운 프레임워크의 동향을 한눈에 파악하세요.
        </p>
      </header>

      {/* 서론 (SEO용 콘텐츠) */}
      <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 mb-12">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          오픈소스 생태계 동향
        </h2>
        <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base mb-4">
          오픈소스 커뮤니티는 그 어느 때보다 활발하게 움직이고 있습니다. AI, 웹 개발, 데이터 분석 등 다양한 분야에서 혁신적인 프로젝트들이 쏟아져 나오고 있으며, 특히 개발자 경험(DX)을 극대화하는 도구들이 많은 별(Stars)을 받고 있습니다.
        </p>
        <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base">
          이번 리포트에서는 수많은 신생 및 기존 레포지토리 중에서도 가장 유의미한 성장세를 보인 주요 프로젝트들을 깊이 있게 살펴봅니다. 각 프로젝트가 어떤 문제를 해결하고 있는지, 왜 전 세계 개발자들이 열광하는지 한국어로 쉽게 풀어서 설명합니다.
        </p>
      </section>

      {/* 상위 프로젝트 목록 (기사 형태) */}
      <div className="space-y-8">
        {repos.map((repo, idx) => (
          <article key={repo.id} className="bg-surface border border-line rounded-2xl p-6 sm:p-8 hover:border-accent/30 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 bg-surface-active rounded-xl flex items-center justify-center font-bold text-lg text-accent border border-line">
                {idx + 1}
              </div>
              <div className="flex-1">
                <Link href={`/repo/${repo.fullName}`} className="block group">
                  <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors mb-2">
                    {repo.fullName}
                  </h3>
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
                  <span className="flex items-center gap-1 font-semibold text-text-secondary">
                    <Star className="w-4 h-4 text-star" /> {formatCompactNumber(repo.starsCount)}
                  </span>
                  <span>•</span>
                  <span>{repo.language || '다양한 언어'}</span>
                </div>
              </div>
            </div>

            <div className="pl-0 sm:pl-14">
              <p className="text-text-secondary leading-relaxed mb-6">
                {repo.descriptionKo || repo.description || '이 프로젝트는 현재 큰 성장을 보이고 있는 혁신적인 오픈소스입니다.'}
              </p>
              
              <Link 
                href={`/repo/${repo.fullName}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-active border border-line rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
              >
                상세 분석 보기 <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </Link>
            </div>
          </article>
        ))}

        {repos.length === 0 && (
          <div className="text-center py-20 text-text-tertiary">
            아직 이번 주 분석 데이터가 준비되지 않았습니다.
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-line text-center">
        <p className="text-text-tertiary text-sm">
          이 리포트는 GitHub Public API 데이터와 QUOK-IT의 AI 큐레이션 엔진을 통해 자동으로 작성되었습니다.
        </p>
      </div>
    </div>
  );
}
