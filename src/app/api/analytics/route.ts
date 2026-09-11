import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

const yandexRe = /^\d{4,}$/;
const googleRe = /^[A-Za-z0-9_-]{3,40}$/;
const schema = z.object({
  yandexId: z.string().regex(yandexRe, 'ID Яндекс.Метрики — только цифры').optional().or(z.literal('')),
  googleId: z.string().regex(googleRe, 'Некорректный ID Google Analytics').optional().or(z.literal(''))
});

export async function GET() {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;
  const row = await prisma.analyticsSetting.findFirst();
  return NextResponse.json({ yandexId: row?.yandexId ?? '', googleId: row?.googleId ?? '' });
}

export async function PUT(req: Request) {
  const auth = await requirePermission('settings');
  if ('response' in auth) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Некорректные данные' }, { status: 400 });
  }
  const yandexId = parsed.data.yandexId?.trim() || null;
  const googleId = parsed.data.googleId?.trim() || null;

  const existing = await prisma.analyticsSetting.findFirst();
  const row = existing
    ? await prisma.analyticsSetting.update({ where: { id: existing.id }, data: { yandexId, googleId } })
    : await prisma.analyticsSetting.create({ data: { yandexId, googleId } });

  return NextResponse.json({ yandexId: row.yandexId ?? '', googleId: row.googleId ?? '' });
}
