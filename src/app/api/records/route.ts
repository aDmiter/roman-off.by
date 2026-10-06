import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await requirePermission('records');
  if ('response' in auth) return auth.response;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const usages = await prisma.membershipUsage.findMany({
    where: words.length
      ? {
          AND: words.map((w) => ({
            membership: {
              is: {
                OR: [
                  { code: { contains: w } },
                  { holderName: { contains: w } },
                  { phone: { contains: w } },
                  { typeName: { contains: w } }
                ]
              }
            }
          }))
        }
      : undefined,
    orderBy: { usedAt: 'desc' },
    take: 500,
    include: {
      membership: {
        select: {
          id: true,
          code: true,
          holderName: true,
          phone: true,
          typeName: true,
          totalSessions: true,
          client: { select: { id: true, name: true } }
        }
      }
    }
  });

  return NextResponse.json(
    usages.map((u) => ({
      id: u.id,
      usedAt: u.usedAt,
      note: u.note,
      membershipId: u.membership.id,
      code: u.membership.code,
      holderName: u.membership.client?.name ?? u.membership.holderName,
      phone: u.membership.phone,
      typeName: u.membership.typeName,
      totalSessions: u.membership.totalSessions
    }))
  );
}
