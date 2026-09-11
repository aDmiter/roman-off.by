import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  title: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  busy: z.boolean().optional(),
  note: z.string().nullable().optional(),
  coachId: z.coerce.number().int().optional().nullable(),
  coachName: z.string().optional()
});

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requirePermission('calendar');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }

  const id = Number(params.id);
  const d = parsed.data;

  let coachName = d.coachName;
  if (d.coachId) {
    const coach = await prisma.coach.findUnique({ where: { id: d.coachId } });
    if (coach) coachName = coach.name;
  }

  const session = await prisma.session
    .update({
      where: { id },
      data: {
        date: d.date ? new Date(`${d.date}T00:00:00`) : undefined,
        startTime: d.startTime,
        endTime: d.endTime,
        title: d.title,
        capacity: d.capacity,
        busy: d.busy,
        note: d.note,
        coachId: d.coachId,
        coachName
      },
      include: { coach: true }
    })
    .catch(() => null);
  if (!session) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('calendar');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  await prisma.session.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
