import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/permissions';
import { normalizeBarcode } from '@/lib/utils';
import { barcodePngDataUrl } from '@/lib/barcode';

export async function POST(req: Request) {
  const auth = await requireAnyPermission(['scan', 'memberships']);
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const code = normalizeBarcode(String(body?.code ?? body?.barcode ?? ''));
  if (!code) return NextResponse.json({ error: 'Пустой код' }, { status: 400 });

  const membership = await prisma.membership.findUnique({ where: { code } });
  if (!membership) {
    return NextResponse.json({ error: 'Абонемент не найден', status: 'NOT_FOUND' }, { status: 404 });
  }

  const barcode = await barcodePngDataUrl(membership.code);

  return NextResponse.json({
    membership: {
      id: membership.id,
      code: membership.code,
      holderName: membership.holderName,
      phone: membership.phone,
      totalSessions: membership.totalSessions,
      usedSessions: membership.usedSessions,
      status: membership.status,
      expiresAt: membership.expiresAt,
      remaining: Math.max(0, membership.totalSessions - membership.usedSessions),
      barcode
    }
  });
}
