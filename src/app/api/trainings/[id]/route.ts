import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  title: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  coach: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  color: z.string().optional()
});

type Params = { params: { id: string } };

export async function PATCH(_req: Request, { params }: Params) {
  const auth = await requirePermission('schedule');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await _req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const id = Number(params.id);
  const training = await prisma.training.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!training) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(training);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('schedule');
  if ('response' in auth) return auth.response;

  const id = Number(params.id);
  await prisma.training.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
