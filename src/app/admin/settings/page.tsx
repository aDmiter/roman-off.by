'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, patchJSON, putJSON, del } from '@/lib/api';
import { MEMBERSHIP_SESSIONS, WEEKDAYS } from '@/lib/constants';

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

  const { data: membershipTypes } = useSWR<any[]>('/api/membership-types', fetcher);
  const [mt, setMt] = useState<{ name: string; sessions: number; price: number; durationDays: number }>({ name: '', sessions: 4, price: 0, durationDays: 30 });
  const [editingMtId, setEditingMtId] = useState<number | null>(null);
  const [mtMsg, setMtMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const { data: analyticsData } = useSWR<{ yandexId: string; googleId: string }>('/api/analytics', fetcher);
  const [yandexId, setYandexId] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [anMsg, setAnMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingAn, setSavingAn] = useState(false);

  const submitMt = async () => {
    setMtMsg(null);
    if (mt.name.trim().length < 2) { setMtMsg({ type: 'err', text: 'Выберите занятие' }); return; }
    try {
      if (editingMtId) await patchJSON(`/api/membership-types/${editingMtId}`, mt);
      else await postJSON('/api/membership-types', mt);
      setMt({ name: '', sessions: 4, price: 0, durationDays: 30 });
      setEditingMtId(null);
      mutate('/api/membership-types');
      setMtMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setMtMsg({ type: 'err', text: e.message });
    }
  };

  const startEditMt = (t: any) => {
    setEditingMtId(t.id);
    setMt({ name: t.name, sessions: t.sessions, price: t.price, durationDays: t.durationDays });
  };

  const removeMt = async (id: number) => {
    if (!confirm('Удалить вид абонемента?')) return;
    await del(`/api/membership-types/${id}`);
    mutate('/api/membership-types');
  };

  useEffect(() => {
    if (!analyticsData) return;
    setYandexId(analyticsData.yandexId || '');
    setGoogleId(analyticsData.googleId || '');
  }, [analyticsData]);

  const saveAnalytics = async () => {
    setSavingAn(true);
    setAnMsg(null);
    try {
      await putJSON('/api/analytics', { yandexId, googleId });
      mutate('/api/analytics');
      setAnMsg({ type: 'ok', text: 'Сохранено' });
    } catch (e: any) {
      setAnMsg({ type: 'err', text: e.message });
    } finally {
      setSavingAn(false);
    }
  };

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
            <h2 className="font-display text-base tracking-widest uppercase text-gold">Виды абонементов</h2>
            <p className="mt-1 text-xs text-sub">Занятие + количество занятий + цена + срок действия (дней)</p>
          </div>
          <span className="font-display text-xs tracking-widest text-sub uppercase">{membershipTypes?.length ?? 0} шт.</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-fit rounded-xl border border-white/5 bg-black/30 p-5 lg:col-span-1">
            <h3 className="mb-4 font-display text-sm tracking-widest uppercase text-gold">
              {editingMtId ? 'Редактировать вид' : 'Добавить вид'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-dark">Занятие (название)</label>
                <select className="input-dark" value={mt.name} onChange={(e) => setMt({ ...mt, name: e.target.value })}>
                  <option value="">— выберите занятие —</option>
                  {(lessonTypes ?? []).map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Занятий</label>
                  <select className="input-dark" value={mt.sessions} onChange={(e) => setMt({ ...mt, sessions: Number(e.target.value) })}>
                    {MEMBERSHIP_SESSIONS.map((s) => (
                      <option key={s} value={s}>{s} занятий</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-dark">Срок (дней)</label>
                  <input type="number" className="input-dark" value={mt.durationDays} onChange={(e) => setMt({ ...mt, durationDays: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label-dark">Цена (BYN)</label>
                <input type="number" className="input-dark" value={mt.price} onChange={(e) => setMt({ ...mt, price: Number(e.target.value) })} />
              </div>
              {mtMsg && <p className={`text-sm ${mtMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{mtMsg.text}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={submitMt} className="btn-gold flex-1 px-5 py-3 text-sm">
                  {editingMtId ? 'Сохранить' : 'Добавить'}
                </button>
                {editingMtId && (
                  <button type="button" onClick={() => { setMt({ name: '', sessions: 4, price: 0, durationDays: 30 }); setEditingMtId(null); }} className="btn-ghost px-4 py-3 text-sm">
                    Отмена
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {membershipTypes && membershipTypes.length === 0 && (
              <p className="rounded-xl border border-white/5 bg-black/30 py-12 text-center text-sub">Видов пока нет</p>
            )}
            <div className="space-y-2">
              {(membershipTypes ?? []).map((t: any) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 ${editingMtId === t.id ? 'border-gold/50 bg-gold/5' : 'border-white/5 bg-black/30'}`}
                >
                  <div>
                    <div className="font-display tracking-widest uppercase text-main">{t.name}</div>
                    <div className="mt-1 text-sm text-gold">{t.sessions} занятий · {t.price} BYN · {t.durationDays} дней</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => startEditMt(t)} className="text-xs text-gold-light hover:underline">Изменить</button>
                    <button onClick={() => removeMt(t.id)} className="text-xs text-red-400 hover:underline">Удалить</button>
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
                <input type="time" value={h.openTime} onChange={(e) => setHour(h.dayOfWeek, 'openTime', e.target.value)} className="input-dark !w-auto py-2" />
                <span className="text-sub">—</span>
                <input type="time" value={h.closeTime} onChange={(e) => setHour(h.dayOfWeek, 'closeTime', e.target.value)} className="input-dark !w-auto py-2" />
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

      <div className="card-dark rounded-2xl p-6">
        <div className="mb-6 border-b border-white/5 pb-4">
          <h2 className="font-display text-base tracking-widest uppercase text-gold">Счётчики</h2>
          <p className="mt-1 text-xs text-sub">
            Яндекс.Метрика и Google Analytics. Укажите только ID — код подключается автоматически. Пустое поле = счётчик не загружается.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-dark">ID Яндекс.Метрики (номер счётчика)</label>
            <input className="input-dark" placeholder="12345678" inputMode="numeric" value={yandexId} onChange={(e) => setYandexId(e.target.value)} />
          </div>
          <div>
            <label className="label-dark">ID Google Analytics</label>
            <input className="input-dark" placeholder="G-XXXXXXXXXX" value={googleId} onChange={(e) => setGoogleId(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button onClick={saveAnalytics} disabled={savingAn} className="btn-gold px-6 py-3 text-sm">
            {savingAn ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {anMsg && <span className={`text-sm ${anMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{anMsg.text}</span>}
        </div>
      </div>
    </div>
  );
}
