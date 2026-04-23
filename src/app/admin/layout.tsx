import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/**
 * /admin 레이아웃
 * - Header/Footer를 제외한 독립 레이아웃
 * - 검색엔진 색인 차단
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-[#fafafa]">
      {children}
    </div>
  );
}
