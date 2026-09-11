import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/permissions';

const schema = z.object({ membershipTypeId: z.coerce.number().int().positive() });

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAnyPermission(['scan', 'memberships']);
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Выберите вид абонемента' }, { status: 400 });
  }

  const id = Number(params.id);
  const membership = await prisma.membership.findUnique({ where: { id } });
  if (!membership) return NextResponse.json({ error: 'Абонемент не найден' }, { status: 404 });

  const type = await prisma.membershipType.findUnique({ where: { id: parsed.data.membershipTypeId } });
  if (!type) return NextResponse.json({ error: 'Вид абонемента не найден' }, { status: 400 });

  // Вид занятия при продлении менять нельзя: вид абонемента должен совпадать.
  if (membership.typeName && membership.typeName !== type.name) {
    return NextResponse.json({ error: 'Нельзя изменить вид занятия при продлении' }, { status: 400 });
  }

  const now = new Date();
  const base = membership.expiresAt && membership.expiresAt > now ? membership.expiresAt : now;
  const expiresAt = new Date(base.getTime() + type.durationDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.membership.update({
    where: { id },
    data: {
      totalSessions: { increment: type.sessions },
      expiresAt,
      status: 'ACTIVE',
      typeName: membership.typeName ?? type.name
    }
  });

  return NextResponse.json({
    id: updated.id,
    code: updated.code,
    holderName: updated.holderName,
    phone: updated.phone,
    typeName: updated.typeName,
    price: updated.price,
    totalSessions: updated.totalSessions,
    usedSessions: updated.usedSessions,
    status: updated.status,
    expiresAt: updated.expiresAt,
    remaining: Math.max(0, updated.totalSessions - updated.usedSessions)
  });
}
