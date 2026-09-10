import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  phone: z.string().optional(),
  age: z.string().optional(),
  goal: z.string().optional(),
  time: z.string().optional(),
  sessionId: z.coerce.number().int().optional().nullable(),
  memberId: z.string().optional().nullable()
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { session: { select: { date: true, startTime: true, title: true } } },
    take: 500
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const data = parsed.data;
  const booking = await prisma.booking.create({
    data: {
      name: data.name,
      phone: data.phone ?? '',
      age: data.age ?? null,
      goal: data.goal ?? null,
      time: data.time ?? null,
      sessionId: data.sessionId ?? null,
      memberId: data.memberId ?? null
    }
  });
  if (data.sessionId) {
    await prisma.session
      .update({
        where: { id: data.sessionId },
        data: { bookedCount: { increment: 1 } }
      })
      .catch(() => {});
  }
  return NextResponse.json(booking, { status: 201 });
}
