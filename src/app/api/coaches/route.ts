import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

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
  const auth = await requirePermission('coaches');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const coach = await prisma.coach.create({ data: parsed.data });
  return NextResponse.json(coach, { status: 201 });
}
