import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(3).optional(),
  email: z.string().email().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  photo: z.string().nullable().optional(),
  favoriteCoachId: z.coerce.number().int().optional().nullable()
});

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAnyPermission(['clients', 'memberships']);
  if ('response' in auth) return auth.response;

  const id = Number(params.id);
  const client = await prisma.client
    .findUnique({
      where: { id },
      include: {
        favoriteCoach: { select: { id: true, name: true, specialization: true, color: true, photo: true } },
        visits: {
          orderBy: { visitedAt: 'desc' },
          include: {
            session: { select: { date: true, startTime: true, endTime: true, title: true } },
            coach: { select: { id: true, name: true, color: true } }
          }
        },
        memberships: { orderBy: { createdAt: 'desc' } }
      }
    })
    .catch(() => null);
  if (!client) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requirePermission('clients');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;
  const id = Number(params.id);
  const client = await prisma.client
    .update({
      where: { id },
      data: {
        name: d.name,
        phone: d.phone,
        email: d.email === undefined ? undefined : d.email || null,
        birthDate: d.birthDate === undefined ? undefined : (d.birthDate ? new Date(`${d.birthDate}T00:00:00`) : null),
        photo: d.photo,
        favoriteCoachId: d.favoriteCoachId
      }
    })
    .catch(() => null);
  if (!client) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requirePermission('clients');
  if ('response' in auth) return auth.response;
  const id = Number(params.id);
  await prisma.client.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
