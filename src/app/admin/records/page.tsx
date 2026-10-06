'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

type Record = {
  id: number;
  usedAt: string;
  note?: string | null;
  membershipId: number;
  code: string;
  holderName: string;
  phone: string;
  typeName?: string | null;
  totalSessions: number;
};

export default function RecordsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useSWR<Record[]>(`/api/records?q=${encodeURIComponent(q.trim())}`, fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Записи</h1>
        <p className="mt-1 text-sm text-sub">Все отмеченные списания абонементов с датой и временем</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск: имя, телефон, код, вид абонемента…"
        className="input-dark w-full md:max-w-md"
      />

      {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
      {error && <p className="text-sm text-red-300">{(error as Error).message}</p>}
      {data && data.length === 0 && (
        <p className="rounded-2xl border border-white/5 bg-black/30 py-12 text-center text-sub">Списаний пока нет</p>
      )}

      {data && data.length > 0 && (
        <div className="card-dark overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 font-display text-xs tracking-widest uppercase text-sub">
                <th className="px-4 py-3">Дата и время</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Абонемент</th>
                <th className="px-4 py-3">Код</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const d = new Date(r.usedAt);
                return (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-gold">
                      {d.toLocaleDateString('ru-RU')} {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-main">{r.holderName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sub">{r.phone}</td>
                    <td className="px-4 py-3 text-sub">{r.typeName || `${r.totalSessions} занятий`}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-sub">{r.code}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
