import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QUOK-IT 소개',
  description: 'QUOK-IT은 오픈소스 레포지토리 트렌드를 한국어로 해설하고 큐레이션하는 서비스입니다.',
};

export default function AboutPage() {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-text-primary mb-6 tracking-tight">
        QUOK-IT 소개
      </h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-text-secondary leading-relaxed text-lg mb-8">
          <strong className="text-text-primary">QUOK-IT</strong>은 오늘 전 세계 개발자들이 가장 주목하는
          오픈소스 레포지토리를 한국어로 해설하고 큐레이션하는 무료 서비스입니다.
        </p>

        <h2 className="text-xl font-bold text-text-primary mt-10 mb-4">왜 만들었나요?</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          오픈소스 생태계의 트렌드는 영어 중심으로 빠르게 흘러갑니다.
          한국 개발자들이 이 흐름을 더 빠르게 이해하고, 더 적극적으로 참여할 수 있도록
          QUOK-IT이 그 다리가 되고자 합니다.
        </p>

        <h2 className="text-xl font-bold text-text-primary mt-10 mb-4">두 가지 핵심 축</h2>
        <ul className="space-y-3 text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="text-star font-bold shrink-0 mt-0.5">Stars</span>
            <span><strong className="text-text-primary">화제성</strong> — 오늘 가장 많은 개발자의 관심을 받고 있는 프로젝트</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-fork font-bold shrink-0 mt-0.5">Forks</span>
            <span><strong className="text-text-primary">실용성</strong> — 실제로 많이 복제되어 현장에서 활용되는 프로젝트</span>
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary mt-10 mb-4">이름의 의미</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          <strong className="text-text-primary">QUOK-IT</strong>은
          <em> Quick + Open source + Korean + IT</em>의 조합입니다.
          빠르게, 한국어로, 개발 트렌드를 파악한다는 서비스 철학을 담았습니다.
        </p>

        <h2 className="text-xl font-bold text-text-primary mt-10 mb-4">기술 스택</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          Next.js, Prisma, MariaDB, GitHub Public API 기반으로 구축되었습니다.
          매일 자동으로 트렌딩 레포를 수집하고, 한국어 번역 및 해설을 제공합니다.
        </p>

        <h2 className="text-xl font-bold text-text-primary mt-10 mb-4">문의</h2>
        <p className="text-text-secondary leading-relaxed">
          서비스 관련 문의 및 제안은 GitHub Issues를 통해 보내주세요.
        </p>
      </div>
    </div>
  );
}
