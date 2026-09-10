import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const id = Number(params.id);
  await prisma.membership.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
