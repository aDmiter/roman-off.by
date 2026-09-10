'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { COACH_COLORS } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(2, 'Укажите имя и фамилию'),
  specialization: z.string().min(2, 'Укажите специализацию'),
  photo: z.string().optional(),
  color: z.string().optional()
});

type FormData = z.infer<typeof schema>;
type Coach = FormData & {
  id: number;
  _count?: { sessions: number };
};

const empty: FormData = { name: '', specialization: '', photo: '', color: COACH_COLORS[0] };

export default function CoachesPage() {
  const { data: coaches, isLoading } = useSWR<Coach[]>('/api/coaches', fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty
  });
  const photo = watch('photo');

  const submit = async (data: FormData) => {
    setMsg(null);
    try {
      if (editingId) await patchJSON(`/api/coaches/${editingId}`, data);
      else await postJSON('/api/coaches', data);
      reset(empty);
      setEditingId(null);
      mutate('/api/coaches');
      setMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const startEdit = (c: Coach) => {
    setEditingId(c.id);
    setValue('name', c.name);
    setValue('specialization', c.specialization);
    setValue('photo', c.photo ?? '');
    setValue('color', c.color ?? COACH_COLORS[0]);
  };

  const uploadFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ type: 'err', text: body.error || 'Ошибка загрузки' });
      setUploading(false);
      return;
    }
    setValue('photo', body.url);
    setUploading(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить тренера?')) return;
    await del(`/api/coaches/${id}`);
    mutate('/api/coaches');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Тренеры</h1>
        <p className="mt-1 text-sm text-sub">Преподаватели клуба · используются в календаре</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit(submit)} className="card-dark h-fit rounded-2xl p-6 lg:col-span-1">
          <h2 className="mb-4 font-display text-base tracking-widest uppercase text-gold">
            {editingId ? 'Редактировать' : 'Добавить тренера'}
          </h2>

          <div className="space-y-4">
            {photo ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Фото" className="h-20 w-20 rounded-full border border-gold/40 object-cover" />
                <button type="button" onClick={() => setValue('photo', '')} className="text-xs text-red-400 hover:underline">Убрать фото</button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/20 text-sub">
                Фото
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost w-full px-4 py-2.5 text-sm">
                {uploading ? 'Загрузка...' : 'Загрузить фото'}
              </button>
            </div>

            <div>
              <label className="label-dark">Имя и фамилия</label>
              <input className="input-dark" placeholder="Иван Иванов" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label-dark">Специализация</label>
              <input className="input-dark" placeholder="Рукопашный бой / ММА" {...register('specialization')} />
              {errors.specialization && <p className="mt-1 text-xs text-red-400">{errors.specialization.message}</p>}
            </div>
            <div>
              <label className="label-dark">Цвет в календаре</label>
              <div className="flex flex-wrap gap-2">
                {COACH_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setValue('color', c)} className="h-7 w-7 rounded-full border-2 transition-transform"
                    style={{ backgroundColor: c, borderColor: watch('color') === c ? '#fff' : 'transparent' }} />
                ))}
              </div>
            </div>
            {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-gold flex-1 px-5 py-3 text-sm">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { reset(empty); setEditingId(null); }} className="btn-ghost px-4 py-3 text-sm">Отмена</button>
              )}
            </div>
          </div>
        </form>

        <div className="lg:col-span-2">
          {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
          {coaches && coaches.length === 0 && (
            <p className="rounded-2xl border border-white/5 bg-black/30 py-12 text-center text-sub">Тренеров пока нет</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {(coaches ?? []).map((c) => (
              <div key={c.id} className="card-dark flex items-center gap-4 rounded-2xl p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full" style={{ backgroundColor: c.color || '#2a2a2a' }}>
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-black/60">
                      {c.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display tracking-widest uppercase text-main">{c.name}</div>
                  <div className="truncate text-sm text-sub">{c.specialization}</div>
                  <div className="mt-1 text-xs text-gold/70">{c._count?.sessions ?? 0} записей</div>
                  <div className="mt-2 flex gap-3">
                    <button onClick={() => startEdit(c)} className="text-xs text-gold-light hover:underline">Изменить</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:underline">Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
