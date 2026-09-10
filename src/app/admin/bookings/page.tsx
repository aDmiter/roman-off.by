'use client';

import useSWR from 'swr';
import { mutate } from 'swr';
import { fetcher, del } from '@/lib/api';

type Booking = {
  id: number;
  name: string;
  phone: string;
  age?: string;
  goal?: string;
  time?: string;
  createdAt: string;
  session?: { date: string; startTime: string; title: string } | null;
};

export default function BookingsPage() {
  const { data: bookings, isLoading } = useSWR<Booking[]>('/api/bookings', fetcher);

  const remove = async (id: number) => {
    if (!confirm('Удалить заявку?')) return;
    await del(`/api/bookings/${id}`);
    mutate('/api/bookings');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Заявки на запись</h1>
        <p className="mt-1 text-sm text-sub">Заявки с формы на сайте</p>
      </div>

      {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
      {bookings && bookings.length === 0 && (
        <p className="rounded-2xl border border-white/5 bg-black/30 py-12 text-center text-sub">Пока нет заявок</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(bookings ?? []).map((b) => (
          <div key={b.id} className="card-dark rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg tracking-widest uppercase text-main">{b.name}</div>
                <div className="text-xs text-sub">{b.phone}</div>
              </div>
              <span className="text-xs text-sub">{new Date(b.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-sub">Возраст</div>
                <div className="text-main">{b.age || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-sub">Время</div>
                <div className="text-main">{b.time || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-sub">Цель</div>
                <div className="text-main">{b.goal || '—'}</div>
              </div>
              {b.session && (
                <div className="col-span-2">
                  <div className="text-xs text-sub">Привязан к слоту</div>
                  <div className="text-gold">{b.session.title} · {new Date(b.session.date).toLocaleDateString('ru-RU')} {b.session.startTime}</div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => remove(b.id)} className="text-sm text-red-400 hover:underline">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
