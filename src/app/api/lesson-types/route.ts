import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2, 'Укажите название'),
  durationMinutes: z.coerce.number().int().positive('Укажите продолжительность')
});

export async function GET() {
  const lessonTypes = await prisma.lessonType.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json(lessonTypes);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const lessonType = await prisma.lessonType.create({ data: parsed.data });
  return NextResponse.json(lessonType, { status: 201 });
}
