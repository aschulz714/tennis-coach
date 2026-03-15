import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { pin } = await request.json();
  const correctPin = process.env.COACH_PIN;

  if (!correctPin) {
    return NextResponse.json(
      { error: 'COACH_PIN not configured on server' },
      { status: 500 }
    );
  }

  if (pin !== correctPin) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('pin-auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  return response;
}
