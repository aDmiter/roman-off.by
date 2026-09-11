'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/api';
import { toDateKey } from '@/lib/utils';

type Membership = {
  id: number;
  code: string;
  holderName: string;
  totalSessions: number;
  usedSessions: number;
  remaining: number;
  status: string;
  createdAt: string;
};
type BookingLite = { id: number; name: string; phone: string; goal?: string; createdAt: string };
type Session = { id: number; date: string; startTime: string; title: string; busy: boolean; bookedCount: number; capacity: number };
type Me = { permissions: string[] };

export default function AdminDashboard() {
  const { data: memberships } = useSWR<Membership[]>('/api/memberships', fetcher);
  const { data: bookings } = useSWR<BookingLite[]>('/api/bookings', fetcher);
  const { data: sessions } = useSWR<Session[]>('/api/sessions?from=1980-01-01&to=2100-01-01', fetcher);
  const { data: me } = useSWR<Me>('/api/admin/me', fetcher);
  const perms = me?.permissions ?? [];

  const active = memberships?.filter((m) => m.status === 'ACTIVE' && m.remaining > 0) ?? [];
  const today = toDateKey(new Date());
  const todaySessions = sessions?.filter((s) => toDateKey(new Date(s.date)) === today) ?? [];

  const stats = [
    { label: 'Всего абонементов', value: memberships?.length ?? '—', sub: `${active.length} активных` },
    { label: 'Осталось занятий', value: active.reduce((a, m) => a + m.remaining, 0).toLocaleString(), sub: 'по активным' },
    { label: 'Заявки на запись', value: bookings?.length ?? '—', sub: 'всего' },
    { label: 'Записей сегодня', value: todaySessions.length, sub: `${todaySessions.reduce((a, s) => a + s.bookedCount, 0)} чел.` }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Обзор</h1>
          <p className="mt-1 text-sm text-sub">Управление клубом ROMANOFF FIGHT CLUB</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {perms.includes('scan') && (
            <Link href="/admin/scan" className="btn-gold px-5 py-2.5 text-sm">
              Сканировать абонемент
            </Link>
          )}
          {perms.includes('calendar') && (
            <Link href="/admin/calendar?new=1" className="btn-ghost px-5 py-2.5 text-sm">
              + Запись
            </Link>
          )}
          {perms.includes('memberships') && (
            <Link href="/admin/memberships" className="btn-ghost px-5 py-2.5 text-sm">
              + Абонемент
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-dark rounded-2xl p-6">
            <div className="font-display text-xs tracking-widest text-sub uppercase">{s.label}</div>
            <div className="mt-2 font-display text-4xl font-bold gold-text">{s.value}</div>
            <div className="mt-1 text-xs text-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-dark rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base tracking-widest uppercase text-gold">Последние абонементы</h2>
            <Link href="/admin/memberships" className="text-sm text-gold-light hover:underline">
              Все →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-dark w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 pr-4">Владелец</th>
                  <th className="py-2 pr-4">Код</th>
                  <th className="py-2 pr-4">Остаток</th>
                  <th className="py-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {(memberships ?? []).slice(0, 6).map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4">{m.holderName}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-sub">{m.code}</td>
                    <td className="py-3 pr-4 text-gold">{m.remaining}/{m.totalSessions}</td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${m.status === 'ACTIVE' ? 'bg-green-500/15 text-green-300' : m.status === 'USED_UP' ? 'bg-red-500/15 text-red-300' : 'bg-white/10 text-sub'}`}>
                        {m.status === 'ACTIVE' ? 'Активен' : m.status === 'USED_UP' ? 'Использован' : 'Просрочен'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!memberships && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sub">Загрузка...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-dark rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base tracking-widest uppercase text-gold">Заявки на запись</h2>
            <Link href="/admin/bookings" className="text-sm text-gold-light hover:underline">
              Все →
            </Link>
          </div>
          <div className="space-y-3">
            {(bookings ?? []).slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 px-4 py-3">
                <div>
                  <div className="text-sm text-main">{b.name}</div>
                  <div className="text-xs text-sub">{b.goal || b.phone || '—'}</div>
                </div>
                <span className="text-xs text-sub">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            ))}
            {!bookings && <p className="py-6 text-center text-sub">Загрузка...</p>}
            {bookings && bookings.length === 0 && <p className="py-6 text-center text-sub">Пока нет заявок</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
