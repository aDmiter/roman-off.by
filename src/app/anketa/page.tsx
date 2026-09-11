'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

type Coach = { id: number; name: string };

export default function AnketaPage() {
  const { data: coaches } = useSWR<Coach[]>('/api/coaches', fetcher);
  const [form, setForm] = useState({ name: '', phone: '', email: '', birthDate: '', favoriteCoachId: '', company: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = (file?: File) => {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) { setError('Укажите имя и фамилию'); return; }
    if (form.phone.trim().length < 3) { setError('Укажите телефон'); return; }

    setLoading(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('phone', form.phone);
    fd.append('email', form.email);
    fd.append('birthDate', form.birthDate);
    fd.append('favoriteCoachId', form.favoriteCoachId);
    fd.append('company', form.company);
    if (photo) fd.append('photo', photo);

    try {
      const res = await fetch('/api/public/clients', { method: 'POST', body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Не удалось отправить анкету');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/logo.png" alt="ROMANOFF" className="mx-auto h-20 w-20 object-contain" />
          <div className="mt-3 font-display text-2xl font-bold tracking-widest gold-text uppercase">ROMANOFF</div>
          <div className="font-display text-xs tracking-[0.3em] text-sub uppercase">Fight Club · Анкета клиента</div>
        </div>

        {done ? (
          <div className="card-dark rounded-2xl p-8 text-center">
            <div className="font-display text-2xl font-bold gold-text uppercase">Спасибо!</div>
            <p className="mt-3 text-sub">
              Анкета отправлена. Мы добавили вас в базу клуба и свяжемся для подтверждения.
            </p>
            <a href="/" className="btn-ghost mt-6 inline-flex px-6 py-3 text-sm">На главную</a>
          </div>
        ) : (
          <form onSubmit={submit} className="card-dark rounded-2xl p-6">
            <p className="mb-5 text-sm text-sub">Заполните данные — так мы быстрее подберём тренировки и свяжемся с вами.</p>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Фото" className="h-24 w-24 rounded-full border border-gold/40 object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/20 text-sub">Фото</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost px-4 py-2 text-xs">
                  {preview ? 'Заменить фото' : 'Загрузить фото'}
                </button>
              </div>

              <div>
                <label className="label-dark">Имя и фамилия *</label>
                <input className="input-dark" placeholder="Иван Иванов" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-dark">Телефон *</label>
                <input className="input-dark" inputMode="tel" placeholder="+375 29 ..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label-dark">Email</label>
                <input className="input-dark" type="email" placeholder="you@mail.by" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label-dark">Дата рождения</label>
                <input className="input-dark" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="label-dark">Любимый тренер</label>
                <select className="input-dark" value={form.favoriteCoachId} onChange={(e) => setForm({ ...form, favoriteCoachId: e.target.value })}>
                  <option value="">— не выбран —</option>
                  {(coaches ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* honeypot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />

              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full px-6 py-4 text-base">
                {loading ? 'Отправляем...' : 'Отправить анкету'}
              </button>
              <p className="text-center text-xs text-sub">Данные попадут в базу клуба с пометкой «Непроверено».</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
