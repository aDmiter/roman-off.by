import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Некорректная форма' }, { status: 400 });

  // honeypot: боты заполняют скрытое поле
  if (String(form.get('company') || '').trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = String(form.get('name') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  const email = String(form.get('email') || '').trim();
  const birthDate = String(form.get('birthDate') || '').trim();
  const favoriteCoachIdRaw = String(form.get('favoriteCoachId') || '').trim();

  if (name.length < 2) return NextResponse.json({ error: 'Укажите имя и фамилию' }, { status: 400 });
  if (phone.length < 3) return NextResponse.json({ error: 'Укажите телефон' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  const existing = await prisma.client.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: 'Клиент с таким телефоном уже есть в базе. Мы свяжемся с вами.' }, { status: 409 });
  }

  let photo: string | null = null;
  const entry = form.get('photo');
  if (entry && typeof entry !== 'string' && typeof entry.arrayBuffer === 'function' && entry.size > 0) {
    const type = (entry.type || '').toString();
    const size = entry.size || 0;
    if (!ALLOWED.includes(type)) {
      return NextResponse.json({ error: 'Фото: JPG, PNG, WebP или GIF' }, { status: 400 });
    }
    if (size > MAX_SIZE) {
      return NextResponse.json({ error: 'Фото: максимум 5 МБ' }, { status: 400 });
    }
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const ext = ((entry.name || 'photo').toString().split('.').pop() || 'jpg').toLowerCase();
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(await entry.arrayBuffer()));
    photo = `/api/files/${filename}`;
  }

  let favoriteCoachId: number | null = null;
  if (favoriteCoachIdRaw) {
    const parsed = Number(favoriteCoachIdRaw);
    if (!Number.isNaN(parsed)) {
      const coach = await prisma.coach.findUnique({ where: { id: parsed } });
      if (coach) favoriteCoachId = coach.id;
    }
  }

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      email: email || null,
      birthDate: birthDate ? new Date(`${birthDate}T00:00:00`) : null,
      favoriteCoachId,
      photo,
      verified: false
    }
  });

  return NextResponse.json({ ok: true, id: client.id }, { status: 201 });
}
