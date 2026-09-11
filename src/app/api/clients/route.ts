import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/permissions';

const schema = z.object({
  name: z.string().min(2, 'Укажите имя и фамилию'),
  phone: z.string().min(3, 'Укажите телефон'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  photo: z.string().optional(),
  favoriteCoachId: z.coerce.number().int().optional().nullable()
});

export async function GET() {
  const auth = await requireAnyPermission(['clients', 'memberships']);
  if ('response' in auth) return auth.response;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { favoriteCoach: { select: { id: true, name: true, color: true } }, _count: { select: { visits: true, memberships: true } } },
    take: 300
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const auth = await requirePermission('clients');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const d = parsed.data;
  const client = await prisma.client.create({
    data: {
      name: d.name,
      phone: d.phone,
      email: d.email || null,
      birthDate: d.birthDate ? new Date(`${d.birthDate}T00:00:00`) : null,
      photo: d.photo || null,
      favoriteCoachId: d.favoriteCoachId ?? null
    }
  });
  return NextResponse.json(client, { status: 201 });
}
