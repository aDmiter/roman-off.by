'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { postJSON } from '@/lib/api';
import { ADMIN_SECTIONS } from '@/lib/constants';

export default function Sidebar({ userName, permissions }: { userName: string; permissions: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = ADMIN_SECTIONS.filter((s) => permissions.includes(s.key));

  const logout = async () => {
    await postJSON('/api/auth/logout', {}).catch(() => {});
    router.push('/login');
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uploads/logo.png" alt="ROMANOFF" className="h-9 w-9 object-contain" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-widest gold-text uppercase">ROMANOFF</span>
          <span className="font-display text-[10px] tracking-[0.3em] text-sub uppercase">Admin</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-4">
        {links.map((l) => {
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm tracking-widest uppercase transition-colors ${isActive ? 'bg-gold/15 text-gold' : 'text-sub hover:bg-white/5 hover:text-main'}`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/5 px-5 py-4">
        <div className="text-sm text-main">{userName}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-sub">
          <button onClick={logout} className="hover:text-red-400">Выйти</button>
          <Link href="/" className="hover:text-gold">На сайт</Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-black/60 md:block">{content}</aside>

      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:hidden">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/logo.png" alt="ROMANOFF" className="h-7 w-7 object-contain" />
          <span className="font-display text-sm font-bold tracking-widest gold-text uppercase">ROMANOFF Admin</span>
        </span>
        <button onClick={() => setOpen(!open)} className="font-display text-gold uppercase">
          {open ? '✕ Меню' : '☰ Меню'}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-64 border-r border-white/10 bg-black">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
