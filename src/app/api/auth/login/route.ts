import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword, verifyPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Centrfightbrest@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  let user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user && email === ADMIN_EMAIL && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
    user = await prisma.adminUser.create({
      data: {
        name: 'Сергей Романов',
        email: ADMIN_EMAIL,
        phone: '+375297251640',
        password: hashPassword(ADMIN_PASSWORD),
        role: 'SUPERADMIN'
      }
    });
  }

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ error: 'Аккаунт отключён. Обратитесь к администратору.' }, { status: 403 });
  }

  const token = await createSession(user.id);
  const isHttps = new URL(req.url).protocol === 'https:';
  const res = NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
    secure: isHttps
  });
  return res;
}
