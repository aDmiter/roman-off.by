import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2).optional(),
  specialization: z.string().min(2).optional(),
  photo: z.string().nullable().optional(),
  color: z.string().nullable().optional()
});

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requirePermission('coaches');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const id = Number(params.id);
  const coach = await prisma.coach.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!coach) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(coach);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('coaches');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  await prisma.coach.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
