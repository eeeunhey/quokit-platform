import { NextRequest, NextResponse } from 'next/server';

/**
 * 관리자 로그인 API
 * 
 * POST /api/admin/login
 * Body: { password: string }
 * 
 * 성공 시 admin_session 쿠키를 설정합니다.
 * 쿠키는 httpOnly, secure, sameSite=strict로 보호됩니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (password !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 인증 성공 → 세션 쿠키 설정
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', adminSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 4, // 4시간 후 만료
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
