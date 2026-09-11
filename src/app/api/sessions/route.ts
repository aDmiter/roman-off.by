import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/permissions';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1),
  capacity: z.coerce.number().int().positive().default(20),
  busy: z.boolean().default(false),
  note: z.string().optional(),
  trainingId: z.coerce.number().int().optional().nullable(),
  coachId: z.coerce.number().int().optional().nullable(),
  coachName: z.string().optional()
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const coachId = url.searchParams.get('coachId');
  const filter: any = {};
  if (from) filter.date = { gte: new Date(`${from}T00:00:00`) };
  if (to) filter.date = { ...filter.date, lte: new Date(`${to}T00:00:00`) };
  if (coachId) filter.coachId = Number(coachId);

  const sessions = await prisma.session.findMany({
    where: filter,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: { coach: true, bookings: { select: { id: true, name: true } } }
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const auth = await requirePermission('calendar');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;

  let coachName = d.coachName ?? '';
  let coachId = d.coachId ?? null;
  if (d.coachId) {
    const coach = await prisma.coach.findUnique({ where: { id: d.coachId } });
    if (coach) {
      coachName = coach.name;
      coachId = coach.id;
    }
  }

  const session = await prisma.session.create({
    data: {
      date: new Date(`${d.date}T00:00:00`),
      startTime: d.startTime,
      endTime: d.endTime,
      title: d.title,
      coachName,
      coachId,
      capacity: d.capacity,
      busy: d.busy,
      note: d.note,
      trainingId: d.trainingId ?? null
    },
    include: { coach: true }
  });
  return NextResponse.json(session, { status: 201 });
}
