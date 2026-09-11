import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  title: z.string().min(1),
  groupName: z.string().min(1),
  category: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  coach: z.string().min(1),
  capacity: z.coerce.number().int().positive().default(20),
  color: z.string().optional()
});

export async function GET() {
  const trainings = await prisma.training.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  return NextResponse.json(trainings);
}

export async function POST(req: Request) {
  const auth = await requirePermission('schedule');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const training = await prisma.training.create({ data: parsed.data });
  return NextResponse.json(training, { status: 201 });
}
