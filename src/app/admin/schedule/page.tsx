'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mutate } from 'swr';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { CATEGORIES, WEEKDAYS, WEEKDAYS_SHORT } from '@/lib/constants';

const schema = z.object({
  title: z.string().min(1, 'Название'),
  groupName: z.string().min(1, 'Группа'),
  category: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'ЧЧ:ММ'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'ЧЧ:ММ'),
  coach: z.string().min(1, 'Тренер'),
  capacity: z.coerce.number().int().positive()
});

type FormData = z.infer<typeof schema>;
type Training = FormData & { id: number };

const empty: FormData = {
  title: '', groupName: '', category: 'ДЕТИ', dayOfWeek: 1,
  startTime: '19:00', endTime: '20:00', coach: 'Сергей Романов', capacity: 20
};

export default function SchedulePage() {
  const { data: trainings } = useSWR<Training[]>('/api/trainings', fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty
  });

  const submit = async (data: FormData) => {
    setMsg(null);
    try {
      if (editingId) {
        await patchJSON(`/api/trainings/${editingId}`, data);
      } else {
        await postJSON('/api/trainings', data);
      }
      reset(empty);
      setEditingId(null);
      mutate('/api/trainings');
      setMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const startEdit = (t: Training) => {
    setEditingId(t.id);
    setValue('title', t.title);
    setValue('groupName', t.groupName);
    setValue('category', t.category);
    setValue('dayOfWeek', t.dayOfWeek);
    setValue('startTime', t.startTime);
    setValue('endTime', t.endTime);
    setValue('coach', t.coach);
    setValue('capacity', t.capacity);
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить тренировку из расписания?')) return;
    await del(`/api/trainings/${id}`);
    mutate('/api/trainings');
  };

  const grouped = Array.from({ length: 7 }, (_, i) => i + 1).map((day) => ({
    day,
    items: (trainings ?? []).filter((t) => t.dayOfWeek === day)
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Расписание</h1>
        <p className="mt-1 text-sm text-sub">Недельное расписание занятий — показывается на сайте</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit(submit)} className="card-dark h-fit rounded-2xl p-6 lg:col-span-1">
          <h2 className="mb-4 font-display text-base tracking-widest uppercase text-gold">
            {editingId ? 'Редактировать' : 'Добавить тренировку'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-dark">Категория</label>
              <select className="input-dark" {...register('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">Группа</label>
              <input className="input-dark" placeholder="Дети 8-12" {...register('groupName')} />
              {errors.groupName && <p className="mt-1 text-xs text-red-400">{errors.groupName.message}</p>}
            </div>
            <div>
              <label className="label-dark">Название</label>
              <input className="input-dark" placeholder="Группа 1" {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-dark">День недели</label>
                <select className="input-dark" {...register('dayOfWeek')}>
                  {WEEKDAYS.map((w, i) => (
                    <option key={w} value={i + 1}>{WEEKDAYS_SHORT[i]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-dark">Мест</label>
                <input type="number" className="input-dark" {...register('capacity')} />
              </div>
              <div>
                <label className="label-dark">Начало</label>
                <input type="time" className="input-dark" {...register('startTime')} />
              </div>
              <div>
                <label className="label-dark">Конец</label>
                <input type="time" className="input-dark" {...register('endTime')} />
              </div>
            </div>
            <div>
              <label className="label-dark">Тренер</label>
              <input className="input-dark" {...register('coach')} />
              {errors.coach && <p className="mt-1 text-xs text-red-400">{errors.coach.message}</p>}
            </div>
            {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-gold flex-1 px-5 py-3 text-sm">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { reset(empty); setEditingId(null); }} className="btn-ghost px-4 py-3 text-sm">
                  Отмена
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {grouped.map((g) => (
              <div key={g.day} className="card-dark rounded-2xl p-5">
                <h3 className="font-display text-base tracking-widest uppercase text-gold">{WEEKDAYS[g.day - 1]}</h3>
                {g.items.length === 0 && <p className="mt-3 text-sm text-sub">Нет занятий</p>}
                <div className="mt-3 space-y-3">
                  {g.items.map((t) => (
                    <div key={t.id} className="rounded-lg border border-white/5 bg-black/30 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-main">{t.groupName}</div>
                          <div className="text-xs text-sub">{t.category} · {t.coach}</div>
                        </div>
                        <span className="font-display text-sm text-gold">{t.startTime}–{t.endTime}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-sub">{t.title} · {t.capacity} мест</span>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(t)} className="text-xs text-gold-light hover:underline">Изменить</button>
                          <button onClick={() => remove(t.id)} className="text-xs text-red-400 hover:underline">Удалить</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
