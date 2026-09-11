import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2, 'Укажите название'),
  durationMinutes: z.coerce.number().int().positive('Укажите продолжительность')
});

export async function GET() {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const lessonTypes = await prisma.lessonType.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json(lessonTypes);
}

export async function POST(req: Request) {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const lessonType = await prisma.lessonType.create({ data: parsed.data });
  return NextResponse.json(lessonType, { status: 201 });
}
