import { NextResponse } from 'next/server';
import { ADMIN_SECTIONS, ALL_PERMISSION_KEYS, type PermissionKey } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export function isSuperadmin(user: { role: string } | null | undefined): boolean {
  return user?.role === 'SUPERADMIN';
}

/** Эффективные права пользователя: суперадмин — все, остальные — выданные. */
export async function getUserPermissions(user: SessionUser): Promise<PermissionKey[]> {
  if (isSuperadmin(user)) return ALL_PERMISSION_KEYS;
  const rows = await prisma.adminUserPermission.findMany({ where: { userId: user.id } });
  const keys = rows.map((r) => r.permission);
  return ALL_PERMISSION_KEYS.filter((k) => keys.includes(k));
}

/** Раздел (permission) по пути /admin/... (для серверного guard'а маршрутов). */
export function permissionForPath(pathname: string): PermissionKey | null {
  const clean = (pathname || '').split('?')[0].replace(/\/+$/, '');
  if (clean === '/admin' || clean === '') return 'dashboard';
  const match = [...ADMIN_SECTIONS]
    .filter((s) => s.href !== '/admin' && clean.startsWith(s.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? (match.key as PermissionKey) : null;
}

/** Проверка прав для API-роутов. Возвращает user либо готовый 401/403-ответ. */
export async function requirePermission(
  key: PermissionKey
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };

  const perms = await getUserPermissions(user);
  if (!perms.includes(key)) {
    return { response: NextResponse.json({ error: 'Нет доступа к разделу' }, { status: 403 }) };
  }
  return { user };
}

/** Доступ, если у пользователя есть хотя бы одно из прав (для перекрёстных справочников). */
export async function requireAnyPermission(
  keys: PermissionKey[]
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };

  const perms = await getUserPermissions(user);
  if (!keys.some((k) => perms.includes(k))) {
    return { response: NextResponse.json({ error: 'Нет доступа' }, { status: 403 }) };
  }
  return { user };
}

/** Любой авторизованный администратор (для справочных GET-ов). */
export async function requireAuth(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  return { user };
}
