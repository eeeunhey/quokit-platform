import type { Metadata } from 'next';
import { Star, GitFork, Flame, Sparkles, Clock, Globe, Code2, Database, Bot, Mail, Github, Users, TrendingUp, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QUOK-IT 소개 | 한국어 오픈소스 트렌드 큐레이션',
  description: 'QUOK-IT은 전 세계 오픈소스 트렌딩 레포를 한국어로 해설하고 큐레이션하는 무료 서비스입니다. Quick + Open source + Korean + IT.',
};

export default function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">

      {/* ─── Hero ─── */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
          QUOK-IT
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-[600px] mx-auto">
          전 세계 개발자들이 가장 주목하는 오픈소스 레포지토리를<br className="hidden sm:block" />
          <strong className="text-text-primary">한국어</strong>로 해설하고 큐레이션하는 무료 서비스
        </p>
      </div>

      {/* ─── 왜 만들었나요? ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-accent" />
          왜 만들었나요?
        </h2>
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8">
          <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base">
            오픈소스 생태계의 트렌드는 <strong className="text-text-primary">영어 중심</strong>으로 빠르게 흘러갑니다.
            GitHub Trending 페이지에는 매일 수백 개의 프로젝트가 올라왔다 사라지지만,
            영어 설명만으로는 그 프로젝트가 정확히 무엇을 하고, 왜 주목받는지 파악하기 어렵습니다.
          </p>
          <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base mt-4">
            QUOK-IT은 이 격차를 줄이기 위해 만들어졌습니다.
            한국 개발자들이 글로벌 트렌드를 <strong className="text-text-primary">더 빠르게 이해</strong>하고,
            <strong className="text-text-primary">더 적극적으로 참여</strong>할 수 있도록 — QUOK-IT이 그 다리가 되고자 합니다.
          </p>
        </div>
      </section>

      {/* ─── 두 가지 핵심 축 ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          두 가지 핵심 축
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-star/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-star" />
              <span className="font-bold text-text-primary text-lg">Stars</span>
              <span className="text-xs text-text-tertiary bg-surface-active px-2 py-0.5 rounded-full">화제성</span>
            </div>
            <p className="text-text-secondary text-[14px] leading-relaxed">
              오늘 가장 많은 개발자의 관심을 받고 있는 프로젝트입니다.
              스타 수의 급상승은 커뮤니티의 관심이 집중되고 있다는 신호입니다.
            </p>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-6 hover:border-fork/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <GitFork className="w-5 h-5 text-fork" />
              <span className="font-bold text-text-primary text-lg">Forks</span>
              <span className="text-xs text-text-tertiary bg-surface-active px-2 py-0.5 rounded-full">실용성</span>
            </div>
            <p className="text-text-secondary text-[14px] leading-relaxed">
              실제로 많이 복제되어 현장에서 활용되는 프로젝트입니다.
              Fork 수가 높다는 것은 실무에서 직접 사용하거나 기여하는 개발자가 많다는 의미입니다.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 데이터 수집 방식 (듀얼 파이프라인) ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Search className="w-6 h-6 text-accent" />
          데이터는 어떻게 수집하나요?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-line rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-text-primary">🔥 Hot</span>
            </div>
            <p className="text-text-secondary text-[14px] leading-relaxed mb-3">
              GitHub Trending 페이지를 직접 분석하여, <strong className="text-text-primary">기존 레포 중 스타가 급상승</strong>하고 있는
              프로젝트를 포착합니다.
            </p>
            <ul className="text-[13px] text-text-tertiary space-y-1">
              <li>• 신규 + 기존 레포 모두 포함</li>
              <li>• GitHub API Rate Limit 영향 없음</li>
              <li>• 매일 자동 수집</li>
            </ul>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <span className="font-bold text-text-primary">✨ Rising</span>
            </div>
            <p className="text-text-secondary text-[14px] leading-relaxed mb-3">
              GitHub Search API를 활용하여, <strong className="text-text-primary">최근 새로 만들어진 레포</strong> 중
              빠르게 스타를 모으고 있는 프로젝트를 탐색합니다.
            </p>
            <ul className="text-[13px] text-text-tertiary space-y-1">
              <li>• 신생 레포 전용</li>
              <li>• 일간 / 주간 / 월간 필터</li>
              <li>• 언어별 필터 지원</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 주요 기능 ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-accent" />
          주요 기능
        </h2>
        <div className="bg-surface border border-line rounded-2xl divide-y divide-line">
          {[
            { icon: <Flame className="w-5 h-5 text-orange-500" />, title: '듀얼 트렌딩 대시보드', desc: 'Hot(화제성)과 Rising(신생)을 한 화면에서 탭으로 전환하며 비교할 수 있습니다.' },
            { icon: <Bot className="w-5 h-5 text-violet-500" />, title: '한국어 번역 및 AI 요약', desc: '레포지토리 설명과 README를 자동으로 한국어 번역하고, AI가 핵심을 3줄로 요약합니다.' },
            { icon: <Users className="w-5 h-5 text-emerald-500" />, title: '트렌딩 개발자 랭킹', desc: '현재 가장 활발한 오픈소스 기여자들을 리더보드 형태로 확인할 수 있습니다.' },
            { icon: <Clock className="w-5 h-5 text-blue-500" />, title: '기간별 · 언어별 필터', desc: '오늘/이번 주/이번 달, 그리고 Python·TypeScript 등 언어별로 자유롭게 필터링하세요.' },
            { icon: <Globe className="w-5 h-5 text-amber-500" />, title: '글로벌 기술 트렌드 사이드바', desc: '전 세계 개발자 커뮤니티에서 가장 많이 언급되는 기술 키워드를 한눈에 볼 수 있습니다.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-5 sm:p-6">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <h3 className="font-bold text-text-primary text-[15px] mb-1">{title}</h3>
                <p className="text-text-secondary text-[14px] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 이름의 의미 ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4">이름의 의미</h2>
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8">
          <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base mb-4">
            <strong className="text-text-primary text-lg">QUOK-IT</strong>은
            <em className="text-accent"> Quick + Open source + Korean + IT</em>의 조합입니다.
          </p>
          <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base">
            빠르게, 한국어로, 개발 트렌드를 파악한다는 서비스 철학을 담았습니다.
            쿼킷(Quokka)이라는 이름처럼, 항상 웃는 얼굴로 개발자에게 다가가는 서비스가 되고자 합니다.
          </p>
        </div>
      </section>

      {/* ─── 기술 스택 ─── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-accent" />
          기술 스택
        </h2>
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { name: 'Next.js 16', desc: '프론트엔드 & API' },
              { name: 'Prisma', desc: 'ORM' },
              { name: 'MySQL', desc: '데이터베이스' },
              { name: 'Upstash Redis', desc: '캐시 계층' },
              { name: 'GitHub API', desc: '데이터 수집' },
              { name: 'Cheerio', desc: 'HTML 스크래핑' },
              { name: 'Vercel', desc: '배포 & 크론잡' },
              { name: 'Bing/Google', desc: '자동 번역' },
            ].map(({ name, desc }) => (
              <div key={name} className="text-center p-3 bg-surface-active rounded-xl">
                <p className="font-bold text-text-primary text-[14px]">{name}</p>
                <p className="text-text-tertiary text-[12px] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-text-secondary text-[14px] leading-relaxed">
            매일 자동으로 GitHub 트렌딩 레포를 수집하고, 한국어 번역 및 AI 해설을 제공합니다.
            모든 데이터는 크론잡을 통해 매일 갱신되며, Redis 캐시를 통해 빠른 응답 속도를 보장합니다.
          </p>
        </div>
      </section>

      {/* ─── 운영 및 문의 ─── */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Mail className="w-6 h-6 text-accent" />
          운영 및 문의
        </h2>
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8">
          <p className="text-text-secondary leading-[1.85] text-[15px] sm:text-base mb-6">
            서비스 제휴, 광고 배너 구성, 기능 제안 및 오류 신고 등 관련 문의는
            아래 연락처를 통해 보내주세요.
          </p>
          <div className="space-y-3">
            <a 
              href="mailto:eunhye12323@gmail.com"
              className="flex items-center gap-3 text-text-primary hover:text-accent transition-colors group"
            >
              <Mail className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
              <span className="text-[15px] font-medium">eunhye12323@gmail.com</span>
            </a>
            <a 
              href="https://github.com/eeeunhey/quokit-platform/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-text-primary hover:text-accent transition-colors group"
            >
              <Github className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
              <span className="text-[15px] font-medium">GitHub Issues</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
