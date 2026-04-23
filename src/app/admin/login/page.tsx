'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

/**
 * 관리자 로그인 페이지
 * 
 * - 비밀번호 입력 → /api/admin/login으로 POST
 * - 성공 시 admin_session 쿠키 설정 → /admin으로 리다이렉트
 * - 검색엔진에 절대 노출되지 않음 (middleware + robots.txt)
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace('/admin');
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="surface-card p-8">
          {/* 헤더 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <h1 className="text-lg font-bold text-text-primary">관리자 인증</h1>
          </div>

          <p className="text-xs text-text-tertiary text-center mb-6">
            이 페이지는 관리자 전용입니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호"
                className="w-full h-11 pl-10 pr-4 bg-surface-active border border-line rounded-xl 
                           text-sm text-text-primary placeholder:text-text-tertiary
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                           transition-all"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <span className="text-xs text-danger">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 bg-accent text-white text-sm font-semibold rounded-xl
                         hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? '인증 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-text-tertiary text-center mt-4">
          이 페이지는 검색엔진에 색인되지 않습니다.
        </p>
      </div>
    </div>
  );
}
