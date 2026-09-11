import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { generateMembershipCode } from '@/lib/utils';
import { barcodePngDataUrl } from '@/lib/barcode';
import { DEFAULT_TOTAL_SESSIONS } from '@/lib/constants';

const createSchema = z.object({
  holderName: z.string().min(2, 'Укажите имя'),
  phone: z.string().min(1, 'Укажите телефон'),
  totalSessions: z.coerce.number().int().positive().default(DEFAULT_TOTAL_SESSIONS),
  expiresAt: z.string().optional().nullable(),
  clientId: z.coerce.number().int().optional().nullable(),
  membershipTypeId: z.coerce.number().int().optional().nullable()
});

function toView(m: any) {
  return {
    id: m.id,
    code: m.code,
    holderName: m.holderName,
    phone: m.phone,
    typeName: m.typeName,
    price: m.price,
    membershipTypeId: m.membershipTypeId,
    totalSessions: m.totalSessions,
    usedSessions: m.usedSessions,
    status: m.status,
    createdAt: m.createdAt,
    expiresAt: m.expiresAt,
    remaining: Math.max(0, m.totalSessions - m.usedSessions)
  };
}

export async function GET() {
  const auth = await requirePermission('memberships');
  if ('response' in auth) return auth.response;

  const memberships = await prisma.membership.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  const view = await Promise.all(memberships.map(async (m) => ({ ...toView(m), barcode: await barcodePngDataUrl(m.code) })));
  return NextResponse.json(view);
}

export async function POST(req: Request) {
  const auth = await requirePermission('memberships');
  if ('response' in auth) return auth.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const data = parsed.data;

  let totalSessions = data.totalSessions;
  let price: number | null = null;
  let typeName: string | null = null;
  let expiresAt = data.expiresAt ? new Date(`${data.expiresAt}T00:00:00`) : null;

  if (data.membershipTypeId) {
    const type = await prisma.membershipType.findUnique({ where: { id: data.membershipTypeId } });
    if (!type) return NextResponse.json({ error: 'Вид абонемента не найден' }, { status: 400 });
    totalSessions = type.sessions;
    price = type.price;
    typeName = type.name;
    expiresAt = new Date(Date.now() + type.durationDays * 24 * 60 * 60 * 1000);
  }

  let code = generateMembershipCode();
  while (await prisma.membership.findUnique({ where: { code } })) {
    code = generateMembershipCode();
  }

  const membership = await prisma.membership.create({
    data: {
      code,
      holderName: data.holderName,
      phone: data.phone,
      totalSessions,
      price,
      typeName,
      membershipTypeId: data.membershipTypeId ?? null,
      expiresAt,
      clientId: data.clientId ?? null
    }
  });

  const barcode = await barcodePngDataUrl(code);

  return NextResponse.json({ ...toView(membership), barcode }, { status: 201 });
}
