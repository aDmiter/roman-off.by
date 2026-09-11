import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserPermissions } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const permissions = await getUserPermissions(user);
  return NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role, phone: user.phone },
    permissions
  });
}
