import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | QUOK-IT',
  description: 'QUOK-IT 서비스 이용약관입니다.',
};

export default function TermsPage() {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-text-primary mb-6 tracking-tight">
        이용약관 (Terms of Service)
      </h1>

      <p className="text-sm text-text-tertiary mb-8">최종 수정일: 2026년 5월 10일</p>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제1조 (목적)</h2>
          <p className="text-text-secondary leading-relaxed">
            본 약관은 QUOK-IT(이하 &quot;회사&quot;)이 제공하는 오픈소스 트렌드 큐레이션 서비스 및 관련 제반 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제2조 (정의)</h2>
          <p className="text-text-secondary leading-relaxed">
            &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 받는 자를 말합니다. 본 서비스는 별도의 회원가입 없이 누구나 이용할 수 있는 공개 웹사이트 형태로 제공됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제3조 (서비스의 제공 및 변경)</h2>
          <p className="text-text-secondary leading-relaxed">
            회사는 다음과 같은 서비스를 제공합니다:<br/>
            1. GitHub 오픈소스 트렌딩 정보 제공 및 번역<br/>
            2. 오픈소스 개발자 순위 정보 제공<br/>
            3. 기타 회사가 추가 개발하거나 제휴계약 등을 통해 이용자에게 제공하는 일체의 서비스<br/><br/>
            회사는 서비스의 내용, 운영상 또는 기술상의 필요에 따라 제공하고 있는 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제4조 (데이터 출처 및 저작권)</h2>
          <p className="text-text-secondary leading-relaxed">
            본 서비스에서 제공하는 리포지토리 정보, README 문서, 개발자 정보 등은 모두 GitHub Public API를 통해 수집된 공개 데이터입니다. 원본 데이터의 저작권은 원저작자에게 있으며, 회사가 제공하는 한국어 번역물 및 AI 요약 정보는 단순 참고용으로 제공됩니다. 회사는 번역의 완벽성이나 정확성을 보증하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제5조 (책임제한)</h2>
          <p className="text-text-secondary leading-relaxed">
            회사는 천재지변, 서비스 점검, 외부 API(GitHub 등)의 장애, 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 또한, 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제6조 (광고의 게재)</h2>
          <p className="text-text-secondary leading-relaxed">
            회사는 서비스 운영과 관련하여 서비스 화면, 홈페이지 등에 광고(Google AdSense 등)를 게재할 수 있습니다. 이용자는 서비스 이용 시 노출되는 광고 게재에 대해 동의하는 것으로 간주됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-3">제7조 (관할법원)</h2>
          <p className="text-text-secondary leading-relaxed">
            서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국의 법원을 관할법원으로 합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
