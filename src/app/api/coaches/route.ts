import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  specialization: z.string().min(2, 'Укажите специализацию'),
  photo: z.string().optional().nullable(),
  color: z.string().optional().nullable()
});

export async function GET() {
  const coaches = await prisma.coach.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { sessions: true } } }
  });
  return NextResponse.json(coaches);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const coach = await prisma.coach.create({ data: parsed.data });
  return NextResponse.json(coach, { status: 201 });
}
