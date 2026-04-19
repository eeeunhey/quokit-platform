import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="animate-in">
      {/* Subtle tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6
                      text-xs font-medium text-accent bg-accent-light 
                      rounded-full border border-accent/10">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        실시간 업데이트
      </div>

      <h1 className="text-3xl md:text-[40px] font-extrabold leading-tight tracking-tight text-text-primary mb-4">
        GitHub 트렌드를 한국어로,{' '}
        <br className="hidden md:block" />
        실제로 쓰이는 오픈소스까지{' '}
        <span className="text-accent">한눈에</span>
      </h1>

      <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
        오늘 가장 주목받는 레포
        <span className="inline-flex items-center mx-1 text-star font-semibold">(Stars)</span>와 
        실제로 많이 활용되는 레포
        <span className="inline-flex items-center mx-1 text-fork font-semibold">(Forks)</span>를 
        함께 큐레이션합니다.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link 
          href="/?sort=stars"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     text-white bg-text-primary hover:bg-text-primary/90
                     rounded-xl transition-colors"
        >
          오늘의 트렌드 보기
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link 
          href="/?sort=forks"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     text-text-primary border border-line hover:border-line-hover
                     hover:bg-surface-hover rounded-xl transition-colors"
        >
          포크 많은 레포 보기
        </Link>
      </div>
    </div>
  );
}
