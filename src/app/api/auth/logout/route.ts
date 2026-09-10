import { NextResponse } from 'next/server';
import { destroySession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  await destroySession();
  const isHttps = new URL(req.url).protocol === 'https:';
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0, secure: isHttps });
  return res;
}
