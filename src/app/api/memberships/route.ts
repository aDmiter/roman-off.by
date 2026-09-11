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
  clientId: z.coerce.number().int().optional().nullable()
});

function toView(m: any) {
  return {
    id: m.id,
    code: m.code,
    holderName: m.holderName,
    phone: m.phone,
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

  let code = generateMembershipCode();
  while (await prisma.membership.findUnique({ where: { code } })) {
    code = generateMembershipCode();
  }

  const membership = await prisma.membership.create({
    data: {
      code,
      holderName: data.holderName,
      phone: data.phone,
      totalSessions: data.totalSessions,
      expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T00:00:00`) : null,
      clientId: data.clientId ?? null
    }
  });

  const barcode = await barcodePngDataUrl(code);

  return NextResponse.json({ ...toView(membership), barcode }, { status: 201 });
}
