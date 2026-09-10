import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2).optional(),
  specialization: z.string().min(2).optional(),
  photo: z.string().nullable().optional(),
  color: z.string().nullable().optional()
});

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const id = Number(params.id);
  await prisma.coach.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
