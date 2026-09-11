import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/permissions';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ('response' in auth) return auth.response;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const form = await req.formData().catch(() => null);
  const entry = form?.get('file');
  if (!entry || typeof entry === 'string' || typeof entry.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
  }

  const name = (entry.name || 'file').toString();
  const type = (entry.type || 'image/png').toString();
  const size = entry.size ?? 0;

  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ error: 'Разрешены JPG, PNG, WebP, GIF' }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'Максимум 5 МБ' }, { status: 400 });
  }

  const ext = (name.split('.').pop() || type.split('/')[1] || 'png').toLowerCase();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await entry.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/api/files/${filename}` });
}
