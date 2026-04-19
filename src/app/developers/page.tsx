import { DevelopersDashboard } from '@/components/dashboard/DevelopersDashboard';

export const metadata = {
  title: '개발자 순위 | QUOK-IT',
  description: 'GitHub 트렌딩에 가장 자주 등장하는 핫한 개발자들을 확인해보세요.',
};

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 md:py-10">
      <DevelopersDashboard />
    </div>
  );
}
