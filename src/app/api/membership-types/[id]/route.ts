import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2).optional(),
  sessions: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().int().min(0).optional(),
  durationDays: z.coerce.number().int().positive().optional()
});

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const id = Number(params.id);
  const type = await prisma.membershipType.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!type) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(type);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  await prisma.membershipType.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
