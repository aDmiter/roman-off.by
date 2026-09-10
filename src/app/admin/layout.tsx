import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="admin-shell flex min-h-screen bg-bg">
      <Sidebar userName={user.name} />
      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pt-6 md:pb-10 md:mt-0 mt-12">{children}</main>
    </div>
  );
}
