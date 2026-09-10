import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

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

  await prisma.membershipUsage.create({
    data: {
      membershipId: id,
      sessionId: body?.sessionId ?? null,
      note: body?.note ?? null
    }
  });

  if (membership.clientId) {
    await prisma.visit.create({
      data: {
        clientId: membership.clientId,
        sessionId: body?.sessionId ?? null,
        coachId: body?.coachId ?? null,
        visitedAt: new Date()
      }
    }).catch(() => {});
  }

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
