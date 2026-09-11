import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requirePermission, isSuperadmin } from '@/lib/permissions';
import { ALL_PERMISSION_KEYS } from '@/lib/constants';

const permEnum = z.enum(ALL_PERMISSION_KEYS as [string, ...string[]]);

const createSchema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(3, 'Укажите телефон'),
  password: z.string().min(6, 'Минимум 6 символов'),
  role: z.enum(['SUPERADMIN', 'STAFF']).default('STAFF'),
  active: z.boolean().default(true),
  permissions: z.array(permEnum).default([])
});

function view(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    permissions: (u.permissions ?? []).map((p: any) => p.permission)
  };
}

export async function GET() {
  const auth = await requirePermission('users');
  if ('response' in auth) return auth.response;

  const users = await prisma.adminUser.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    include: { permissions: true }
  });
  return NextResponse.json(users.map(view));
}

export async function POST(req: Request) {
  const auth = await requirePermission('users');
  if ('response' in auth) return auth.response;
  const caller = auth.user as any;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;
  const email = d.email.trim().toLowerCase();

  if (d.role === 'SUPERADMIN' && !isSuperadmin(caller)) {
    return NextResponse.json({ error: 'Только суперадмин может создавать суперадминов' }, { status: 403 });
  }

  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Пользователь с таким email уже есть' }, { status: 409 });

  const perms = d.role === 'SUPERADMIN' ? [] : d.permissions;

  const user = await prisma.adminUser.create({
    data: {
      name: d.name,
      email,
      phone: d.phone,
      password: hashPassword(d.password),
      role: d.role,
      active: d.active,
      permissions: { create: perms.map((permission) => ({ permission })) }
    },
    include: { permissions: true }
  });
  return NextResponse.json(view(user), { status: 201 });
}
