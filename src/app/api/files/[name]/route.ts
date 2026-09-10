import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
};

type Params = { params: { name: string } };

export async function GET(_req: Request, { params }: Params) {
  const name = path.basename(params.name);
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const type = MIME[ext] || 'application/octet-stream';

  const filePath = path.join(process.cwd(), 'public', 'uploads', name);
  try {
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}
