import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy — /admin 경로 보호
 * 
 * /admin 페이지 및 /api/admin/* 엔드포인트에 대해:
 * - 검색엔진 크롤러 차단 (robots noindex)
 * - 일반 사용자가 URL을 알아도 접근 불가
 * - API는 Authorization 헤더로, 페이지는 쿠키 기반 인증
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 관련 경로만 보호
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    
    // API 엔드포인트: Authorization 헤더 검증
    if (pathname.startsWith('/api/admin')) {
      const authHeader = request.headers.get('authorization');
      const adminSecret = process.env.ADMIN_SECRET;
      
      if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // 관리자 페이지: 쿠키 기반 세션 검증
    // (로그인 페이지 자체는 허용)
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminSession = request.cookies.get('admin_session');
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSession || adminSession.value !== adminSecret) {
      // 인증 안 됨 → 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 인증 됨 — 검색엔진 차단 헤더 추가
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
