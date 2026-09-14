import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/permissions';

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAnyPermission(['scan', 'memberships']);
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const id = Number(params.id);

  const membership = await prisma.membership.findUnique({
    where: { id },
    include: { usages: { orderBy: { usedAt: 'desc' } } }
  });

  if (!membership) return NextResponse.json({ error: 'Абонемент не найден' }, { status: 404 });
  if (membership.status === 'EXPIRED') {
    return NextResponse.json({ error: 'Абонемент просрочен' }, { status: 400 });
  }
  if (membership.usedSessions >= membership.totalSessions) {
    return NextResponse.json({ error: 'Абонемент уже полностью использован' }, { status: 400 });
  }

  const updated = await prisma.membership.update({
    where: { id },
    data: {
      usedSessions: { increment: 1 },
      status: membership.usedSessions + 1 >= membership.totalSessions ? 'USED_UP' : 'ACTIVE'
    }
  });

  let visitId: number | null = null;
  if (membership.clientId) {
    const visit = await prisma.visit
      .create({
        data: {
          clientId: membership.clientId,
          sessionId: body?.sessionId ?? null,
          coachId: body?.coachId ?? null,
          visitedAt: new Date()
        }
      })
      .catch(() => null);
    visitId = visit?.id ?? null;
  }

  await prisma.membershipUsage.create({
    data: {
      membershipId: id,
      sessionId: body?.sessionId ?? null,
      visitId,
      note: body?.note ?? null
    }
  });

  return NextResponse.json({
    ok: true,
    membership: {
      id: updated.id,
      code: updated.code,
      holderName: updated.holderName,
      totalSessions: updated.totalSessions,
      usedSessions: updated.usedSessions,
      status: updated.status,
      remaining: Math.max(0, updated.totalSessions - updated.usedSessions)
    }
  });
}
