import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2, 'Выберите занятие'),
  sessions: z.coerce.number().int().positive('Укажите количество занятий'),
  price: z.coerce.number().int().min(0, 'Укажите цену'),
  durationDays: z.coerce.number().int().positive('Укажите срок действия в днях')
});

export async function GET() {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const types = await prisma.membershipType.findMany({ orderBy: [{ name: 'asc' }, { sessions: 'asc' }] });
  return NextResponse.json(types);
}

export async function POST(req: Request) {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const type = await prisma.membershipType.create({ data: parsed.data });
  return NextResponse.json(type, { status: 201 });
}
