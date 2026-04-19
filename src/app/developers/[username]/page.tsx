import { DeveloperDetail } from '@/components/developer/DeveloperDetail';

export const metadata = {
  title: '개발자 상세 정보 | QUOK-IT',
  description: '이 개발자의 주요 저장소와 GitHub 트렌딩 이력을 한국어로 확인하세요.',
};

export default function DeveloperPage({ params }: { params: { username: string } }) {
  // 실제 프로덕션에서는 params.username을 사용해 DB 연동
  return (
    <div className="bg-[#FAFBFB] min-h-screen pt-8 md:pt-12 px-5 sm:px-6">
      <DeveloperDetail username={params.username} />
    </div>
  );
}
