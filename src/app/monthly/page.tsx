import { MonthlyDashboard } from '@/components/dashboard/MonthlyDashboard';

export const metadata = {
  title: '저장소 월간 반응 | QUOK-IT',
  description: '별점, 포크, 이슈 등 지표별로 보는 오픈소스 월간 분석 리포트',
};

export default function MonthlyPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 md:py-10">
      <MonthlyDashboard />
    </div>
  );
}
