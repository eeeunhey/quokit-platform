import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-3">
              <span className="text-lg font-extrabold tracking-tighter text-text-primary">QUOK</span>
              <span className="text-lg font-extrabold tracking-tighter text-accent">-IT</span>
            </Link>
            <p className="text-xs text-text-tertiary leading-relaxed">
              오픈소스 트렌드를 한국어로.<br />
              Stars(화제성) & Forks(실용성) 두 축으로<br />
              매일 업데이트됩니다.
            </p>
          </div>

          {/* 탐색 */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">탐색</h3>
            <ul className="space-y-2">
              <li><FooterLink href="/?sort=stars">Stars 트렌딩</FooterLink></li>
              <li><FooterLink href="/?sort=forks">Forks 인기</FooterLink></li>
              <li><FooterLink href="/?period=weekly">주간 트렌드</FooterLink></li>
              <li><FooterLink href="/?period=monthly">월간 트렌드</FooterLink></li>
              <li><FooterLink href="/search">검색</FooterLink></li>
            </ul>
          </div>

          {/* 언어 */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">언어별</h3>
            <ul className="space-y-2">
              <li><FooterLink href="/?language=typescript">TypeScript</FooterLink></li>
              <li><FooterLink href="/?language=python">Python</FooterLink></li>
              <li><FooterLink href="/?language=javascript">JavaScript</FooterLink></li>
              <li><FooterLink href="/?language=go">Go</FooterLink></li>
              <li><FooterLink href="/?language=rust">Rust</FooterLink></li>
            </ul>
          </div>

          {/* 사이트 */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">사이트</h3>
            <ul className="space-y-2">
              <li><FooterLink href="/about">QUOK-IT 소개</FooterLink></li>
              <li><FooterLink href="/privacy">개인정보처리방침</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* 하단 카피라이트 */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row
                        items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-text-tertiary">
            © {year} QUOK-IT. 오픈소스 트렌드 큐레이션 서비스.
          </p>
          <p className="text-xs text-text-tertiary">
            데이터 출처: GitHub Public API
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
    >
      {children}
    </Link>
  );
}
