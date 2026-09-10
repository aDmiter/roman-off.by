'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, patchJSON, putJSON, del } from '@/lib/api';
import { WEEKDAYS } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(2, 'Укажите название'),
  durationMinutes: z.coerce.number().int().positive('Укажите продолжительность')
});

type FormData = z.infer<typeof schema>;
type LessonType = FormData & { id: number };

type WorkHours = { dayOfWeek: number; openTime: string; closeTime: string };

const empty: FormData = { name: '', durationMinutes: 60 };

function defaultHours(): WorkHours[] {
  return Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, openTime: '08:00', closeTime: '22:00' }));
}

export default function SettingsPage() {
  const { data: lessonTypes, isLoading } = useSWR<LessonType[]>('/api/lesson-types', fetcher);
  const { data: workHoursData } = useSWR<WorkHours[]>('/api/working-hours', fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [hours, setHours] = useState<WorkHours[]>(defaultHours());
  const [hoursMsg, setHoursMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    if (!workHoursData) return;
    const map = new Map(workHoursData.map((h) => [h.dayOfWeek, h]));
    setHours(defaultHours().map((b) => {
      const found = map.get(b.dayOfWeek);
      return found ? { ...b, openTime: found.openTime, closeTime: found.closeTime } : b;
    }));
  }, [workHoursData]);

  const setHour = (day: number, key: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === day ? { ...h, [key]: value } : h)));
  };

  const saveHours = async () => {
    setSavingHours(true);
    setHoursMsg(null);
    try {
      await putJSON('/api/working-hours', { hours });
      mutate('/api/working-hours');
      setHoursMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setHoursMsg({ type: 'err', text: e.message });
    } finally {
      setSavingHours(false);
    }
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty
  });

  const submit = async (data: FormData) => {
    setMsg(null);
    try {
      if (editingId) await patchJSON(`/api/lesson-types/${editingId}`, data);
      else await postJSON('/api/lesson-types', data);
      reset(empty);
      setEditingId(null);
      mutate('/api/lesson-types');
      setMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const startEdit = (l: LessonType) => {
    setEditingId(l.id);
    setValue('name', l.name);
    setValue('durationMinutes', l.durationMinutes);
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить занятие?')) return;
    await del(`/api/lesson-types/${id}`);
    mutate('/api/lesson-types');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Настройки</h1>
        <p className="mt-1 text-sm text-sub">Базовые параметры клуба</p>
      </div>

      <div className="card-dark rounded-2xl p-6">
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="font-display text-base tracking-widest uppercase text-gold">Занятия</h2>
            <p className="mt-1 text-xs text-sub">Название и продолжительность занятия</p>
          </div>
          <span className="font-display text-xs tracking-widest text-sub uppercase">
            {lessonTypes?.length ?? 0} шт.
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit(submit)} className="h-fit rounded-xl border border-white/5 bg-black/30 p-5 lg:col-span-1">
            <h3 className="mb-4 font-display text-sm tracking-widest uppercase text-gold">
              {editingId ? 'Редактировать занятие' : 'Добавить занятие'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-dark">Название занятия</label>
                <input className="input-dark" placeholder="Групповая тренировка" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label-dark">Продолжительность (мин)</label>
                <input type="number" className="input-dark" placeholder="60" {...register('durationMinutes')} />
                {errors.durationMinutes && <p className="mt-1 text-xs text-red-400">{errors.durationMinutes.message}</p>}
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
            {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
            {lessonTypes && lessonTypes.length === 0 && (
              <p className="rounded-xl border border-white/5 bg-black/30 py-12 text-center text-sub">Занятий пока нет</p>
            )}
            <div className="space-y-2">
              {(lessonTypes ?? []).map((l) => (
                <div
                  key={l.id}
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 ${editingId === l.id ? 'border-gold/50 bg-gold/5' : 'border-white/5 bg-black/30'}`}
                >
                  <div>
                    <div className="font-display tracking-widest uppercase text-main">{l.name}</div>
                    <div className="mt-1 text-sm text-gold">{l.durationMinutes} мин</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => startEdit(l)} className="text-xs text-gold-light hover:underline">Изменить</button>
                    <button onClick={() => remove(l.id)} className="text-xs text-red-400 hover:underline">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-dark rounded-2xl p-6">
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="font-display text-base tracking-widest uppercase text-gold">Время работы</h2>
            <p className="mt-1 text-xs text-sub">Часы работы клуба по дням недели (учитывается при слотах тренировок)</p>
          </div>
        </div>

        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.dayOfWeek} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-5 py-3">
              <div className="font-display tracking-widest uppercase text-main">{WEEKDAYS[h.dayOfWeek - 1]}</div>
              <div className="flex items-center gap-2">
                <input type="time" value={h.openTime} onChange={(e) => setHour(h.dayOfWeek, 'openTime', e.target.value)} className="input-dark w-auto py-2" />
                <span className="text-sub">—</span>
                <input type="time" value={h.closeTime} onChange={(e) => setHour(h.dayOfWeek, 'closeTime', e.target.value)} className="input-dark w-auto py-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button onClick={saveHours} disabled={savingHours} className="btn-gold px-6 py-3 text-sm">
            {savingHours ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {hoursMsg && <span className={`text-sm ${hoursMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{hoursMsg.text}</span>}
        </div>
      </div>
    </div>
  );
}
