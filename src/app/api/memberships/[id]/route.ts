import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('memberships');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  await prisma.membership.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
