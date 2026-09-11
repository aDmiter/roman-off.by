import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const schema = z.object({
  sessionId: z.coerce.number().int().optional().nullable(),
  coachId: z.coerce.number().int().optional().nullable(),
  visitedAt: z.string().optional(),
  note: z.string().optional()
});

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const auth = await requirePermission('clients');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;
  const clientId = Number(params.id);

  const visit = await prisma.visit.create({
    data: {
      clientId,
      sessionId: d.sessionId ?? null,
      coachId: d.coachId ?? null,
      visitedAt: d.visitedAt ? new Date(`${d.visitedAt}T00:00:00`) : new Date(),
      note: d.note ?? null
    },
    include: {
      session: { select: { date: true, startTime: true, endTime: true, title: true } },
      coach: { select: { id: true, name: true, color: true } }
    }
  });
  return NextResponse.json(visit, { status: 201 });
}
