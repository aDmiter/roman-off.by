import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/permissions';

type Params = { params: { id: string; usageId: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAnyPermission(['scan', 'memberships']);
  if ('response' in auth) return auth.response;

  const membershipId = Number(params.id);
  const usageId = Number(params.usageId);

  const usage = await prisma.membershipUsage.findUnique({ where: { id: usageId } });
  if (!usage || usage.membershipId !== membershipId) {
    return NextResponse.json({ error: 'Списание не найдено' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (usage.visitId) {
      const visit = await tx.visit.findUnique({ where: { id: usage.visitId } });
      if (visit) await tx.visit.delete({ where: { id: visit.id } });
    }
    await tx.membershipUsage.delete({ where: { id: usageId } });

    const m = await tx.membership.findUnique({ where: { id: membershipId } });
    if (m) {
      const used = Math.max(0, m.usedSessions - 1);
      await tx.membership.update({
        where: { id: membershipId },
        data: {
          usedSessions: used,
          status: m.status === 'USED_UP' && used < m.totalSessions ? 'ACTIVE' : m.status
        }
      });
    }
  });

  const updated = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { usages: { orderBy: { usedAt: 'desc' } } }
  });

  return NextResponse.json({
    ok: true,
    membership: updated
      ? {
          id: updated.id,
          usedSessions: updated.usedSessions,
          totalSessions: updated.totalSessions,
          status: updated.status,
          remaining: Math.max(0, updated.totalSessions - updated.usedSessions),
          usages: updated.usages.map((u) => ({ id: u.id, usedAt: u.usedAt }))
        }
      : null
  });
}
