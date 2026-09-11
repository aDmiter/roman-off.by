import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('bookings');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (booking?.sessionId) {
    await prisma.session
      .update({
        where: { id: booking.sessionId },
        data: { bookedCount: { decrement: 1 } }
      })
      .catch(() => {});
  }
  await prisma.booking.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
