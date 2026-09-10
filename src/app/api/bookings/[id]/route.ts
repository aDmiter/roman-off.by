import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
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
