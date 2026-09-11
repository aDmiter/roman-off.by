import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { getUserPermissions, permissionForPath } from '@/lib/permissions';
import { ADMIN_SECTIONS } from '@/lib/constants';
import Sidebar from '@/components/admin/Sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const permissions = await getUserPermissions(user);
  const pathname = headers().get('x-pathname') || '/admin';
  const required = permissionForPath(pathname);

  if (required && !permissions.includes(required)) {
    const first = ADMIN_SECTIONS.find((s) => permissions.includes(s.key));
    if (first) redirect(first.href);
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="card-dark max-w-md rounded-2xl p-8 text-center">
          <div className="font-display text-xl font-bold tracking-widest uppercase gold-text">Нет доступа</div>
          <p className="mt-3 text-sm text-sub">
            Ваш аккаунт не имеет доступа ни к одному разделу. Обратитесь к суперадминистратору.
          </p>
          <a href="/login" className="btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">На страницу входа</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell flex min-h-screen bg-bg">
      <Sidebar userName={user.name} permissions={permissions} />
      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pt-6 md:pb-10 md:mt-0 mt-12">{children}</main>
    </div>
  );
}
