import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'QUOK-IT 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-text-primary mb-6 tracking-tight">
        개인정보처리방침
      </h1>

      <p className="text-sm text-text-tertiary mb-8">최종 수정일: 2026년 4월 19일</p>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">1. 수집하는 개인정보</h2>
          <p className="text-text-secondary leading-relaxed">
            QUOK-IT은 서비스 이용 시 다음과 같은 정보를 자동으로 수집할 수 있습니다:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-text-secondary mt-2">
            <li>접속 IP 주소 및 브라우저 정보 (서버 로그)</li>
            <li>페이지 방문 기록 (Google Analytics 사용 시)</li>
            <li>뉴스레터 구독 시 제공한 이메일 주소</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">2. 개인정보의 이용 목적</h2>
          <p className="text-text-secondary leading-relaxed">
            수집된 정보는 다음의 목적으로만 이용됩니다:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-text-secondary mt-2">
            <li>서비스 운영 및 품질 개선</li>
            <li>사용 통계 분석</li>
            <li>뉴스레터 발송 (동의한 경우에 한함)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">3. 개인정보의 보유 및 파기</h2>
          <p className="text-text-secondary leading-relaxed">
            수집된 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다.
            뉴스레터 구독 해지 시 이메일 주소는 즉시 삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">4. 제3자 제공</h2>
          <p className="text-text-secondary leading-relaxed">
            QUOK-IT은 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            단, 법률에 의한 요청이 있는 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">5. 쿠키 및 광고</h2>
          <p className="text-text-secondary leading-relaxed">
            QUOK-IT은 Google AdSense를 통한 광고를 게재할 수 있으며,
            이 과정에서 Google의 쿠키가 사용될 수 있습니다.
            자세한 내용은{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Google의 광고 정책
            </a>
            을 참고하세요.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">6. 개인정보 보호책임자 및 문의</h2>
          <p className="text-text-secondary leading-relaxed">
            개인정보 관련 문의, 불만 처리 등은 아래 연락처 또는 GitHub Issues를 통해 접수할 수 있습니다.<br/><br/>
            <strong>이메일:</strong> eunhye12323@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
