import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await requireAnyPermission(['scan', 'memberships']);
  if ('response' in auth) return auth.response;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Разбиваем запрос на слова: каждое слово ищется в любом поле (имя/фамилия,
  // телефон, код, вид, данные клиента). Слова объединяются по «И» — порядок не важен.
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const memberships = await prisma.membership.findMany({
    where: {
      AND: words.map((w) => ({
        OR: [
          { code: { contains: w } },
          { holderName: { contains: w } },
          { phone: { contains: w } },
          { typeName: { contains: w } },
          { client: { is: { name: { contains: w } } } },
          { client: { is: { email: { contains: w } } } },
          { client: { is: { phone: { contains: w } } } }
        ]
      }))
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { client: { select: { name: true } } }
  });

  return NextResponse.json({
    results: memberships.map((m) => ({
      id: m.id,
      code: m.code,
      holderName: m.holderName,
      phone: m.phone,
      typeName: m.typeName,
      clientName: m.client?.name ?? null,
      totalSessions: m.totalSessions,
      usedSessions: m.usedSessions,
      remaining: Math.max(0, m.totalSessions - m.usedSessions),
      status: m.status,
      expiresAt: m.expiresAt
    }))
  });
}
