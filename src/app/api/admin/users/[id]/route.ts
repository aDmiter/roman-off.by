import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requirePermission, isSuperadmin } from '@/lib/permissions';
import { ALL_PERMISSION_KEYS } from '@/lib/constants';

const permEnum = z.enum(ALL_PERMISSION_KEYS as [string, ...string[]]);

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPERADMIN', 'STAFF']).optional(),
  active: z.boolean().optional(),
  permissions: z.array(permEnum).optional()
});

type Params = { params: { id: string } };

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

async function superadminCount(): Promise<number> {
  return prisma.adminUser.count({ where: { role: 'SUPERADMIN' } });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requirePermission('users');
  if ('response' in auth) return auth.response;
  const caller = auth.user as any;

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;
  const id = params.id;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  const callerIsSuper = isSuperadmin(caller);
  if (target.role === 'SUPERADMIN' && !callerIsSuper) {
    return NextResponse.json({ error: 'Только суперадмин может изменять суперадминов' }, { status: 403 });
  }
  if (d.role === 'SUPERADMIN' && !callerIsSuper) {
    return NextResponse.json({ error: 'Только суперадмин может назначать суперадминов' }, { status: 403 });
  }

  // Нельзя разжаловать/отключить последнего суперадмина и самого себя-суперадмина
  const demoting = target.role === 'SUPERADMIN' && (d.role === 'STAFF' || d.active === false);
  if (demoting) {
    if (target.id === caller.id) {
      return NextResponse.json({ error: 'Нельзя изменить роль/отключить собственный аккаунт суперадмина' }, { status: 400 });
    }
    if ((await superadminCount()) <= 1) {
      return NextResponse.json({ error: 'Нельзя убрать последнего суперадмина' }, { status: 400 });
    }
  }

  const role = d.role ?? target.role;
  const permsForSave = role === 'SUPERADMIN' ? [] : d.permissions;

  const user = await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id },
      data: {
        name: d.name,
        email: d.email ? d.email.trim().toLowerCase() : undefined,
        phone: d.phone,
        password: d.password ? hashPassword(d.password) : undefined,
        role: d.role,
        active: d.active
      }
    });
    if (permsForSave) {
      await tx.adminUserPermission.deleteMany({ where: { userId: id } });
      if (permsForSave.length) {
        await tx.adminUserPermission.createMany({ data: permsForSave.map((permission) => ({ userId: id, permission })) });
      }
    }
    return tx.adminUser.findUnique({ where: { id }, include: { permissions: true } });
  });

  return NextResponse.json(view(user));
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('users');
  if ('response' in auth) return auth.response;
  const caller = auth.user as any;
  const id = params.id;

  if (id === caller.id) {
    return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 });
  }
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  if (target.role === 'SUPERADMIN') {
    if (!isSuperadmin(caller)) {
      return NextResponse.json({ error: 'Только суперадмин может удалять суперадминов' }, { status: 403 });
    }
    if ((await superadminCount()) <= 1) {
      return NextResponse.json({ error: 'Нельзя удалить последнего суперадмина' }, { status: 400 });
    }
  }

  await prisma.adminUser.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
