import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const timeRe = /^\d{2}:\d{2}$/;

const putSchema = z.object({
  hours: z
    .array(
      z.object({
        dayOfWeek: z.coerce.number().int().min(1).max(7),
        openTime: z.string().regex(timeRe, 'Формат ЧЧ:ММ'),
        closeTime: z.string().regex(timeRe, 'Формат ЧЧ:ММ')
      })
    )
    .min(1)
});

export async function GET() {
  const hours = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  return NextResponse.json(hours);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const parsed = putSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }

  for (const h of parsed.data.hours) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: h.dayOfWeek },
      update: { openTime: h.openTime, closeTime: h.closeTime },
      create: { dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime }
    });
  }

  const hours = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  return NextResponse.json(hours);
}
