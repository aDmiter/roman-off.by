'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { formatDateRu, toDateKey, fromDateKey, todayKey } from '@/lib/utils';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1, 'Название'),
  coachId: z.coerce.number().int().positive().optional(),
  capacity: z.coerce.number().int().positive(),
  busy: z.boolean()
});

type FormData = z.infer<typeof schema>;
type Session = FormData & { id: number; bookedCount: number; coachName?: string; note?: string };
type Coach = { id: number; name: string };

const empty: FormData = { date: todayKey(), startTime: '19:00', endTime: '20:00', title: 'Групповое занятие', coachId: undefined, capacity: 20, busy: false };

export default function SlotsPage() {
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const { data: sessions, isLoading } = useSWR<Session[]>('/api/sessions?from=1980-01-01&to=2100-01-01', fetcher);
  const { data: trainings } = useSWR<any[]>('/api/trainings', fetcher);
  const { data: coaches } = useSWR<Coach[]>('/api/coaches', fetcher);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty
  });

  const submit = async (data: FormData) => {
    setMsg(null);
    try {
      await postJSON('/api/sessions', data);
      reset(empty);
      mutate('/api/sessions?from=1980-01-01&to=2100-01-01');
      setMsg({ type: 'ok', text: 'Слот добавлен' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    }
  };

  const toggleBusy = async (s: Session) => {
    await patchJSON(`/api/sessions/${s.id}`, { busy: !s.busy });
    mutate('/api/sessions?from=1980-01-01&to=2100-01-01');
  };

  const remove = async (s: Session) => {
    if (!confirm(`Удалить слот ${s.title} ${s.startTime}?`)) return;
    await del(`/api/sessions/${s.id}`);
    mutate('/api/sessions?from=1980-01-01&to=2100-01-01');
  };

  const makeFromTraining = (t: any) => {
    setValue('title', `${t.groupName} (${t.title})`);
    setValue('startTime', t.startTime);
    setValue('endTime', t.endTime);
    setValue('capacity', t.capacity);
  };

  const byDate = (sessions ?? []).reduce<Record<string, Session[]>>((acc, s) => {
    const key = toDateKey(new Date(s.date));
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Слоты записи</h1>
        <p className="mt-1 text-sm text-sub">Конкретные даты и время, на которые можно записаться</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit(submit)} className="card-dark h-fit rounded-2xl p-6 lg:col-span-1">
          <h2 className="mb-4 font-display text-base tracking-widest uppercase text-gold">Добавить слот</h2>
          <div className="space-y-4">
            <div>
              <label className="label-dark">Быстрая вставка из расписания</label>
              <select className="input-dark text-xs" onChange={(e) => { const t = trainings?.find((x) => x.id === Number(e.target.value)); if (t) makeFromTraining(t); }}>
                <option value="">Выберите...</option>
                {(trainings ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.category} · {t.groupName} · {WDAY(t.dayOfWeek)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-dark">Дата</label>
                <input type="date" className="input-dark" {...register('date')} />
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
              <label className="label-dark">Название</label>
              <input className="input-dark" {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label-dark">Тренер</label>
              <select className="input-dark" {...register('coachId')}>
                <option value="">— выберите —</option>
                {(coaches ?? []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-sub">
              <input type="checkbox" className="h-4 w-4 accent-[#d4af37]" {...register('busy')} />
              Отметить как «занято» (недоступно для записи)
            </label>
            {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
            <button className="btn-gold w-full px-5 py-3 text-sm">Добавить слот</button>
          </div>
        </form>

        <div className="space-y-6 lg:col-span-2">
          {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
          {sessions && sessions.length === 0 && <p className="py-8 text-center text-sub">Слотов пока нет</p>}
          {dates.map((date) => (
            <div key={date} className="card-dark rounded-2xl p-5">
              <h3 className="mb-3 font-display text-base tracking-widest uppercase text-gold">
                {formatDateRu(fromDateKey(date))}
              </h3>
              <div className="space-y-2">
                {byDate[date].map((s) => (
                  <div key={s.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${s.busy ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-black/30'}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-gold">{s.startTime}–{s.endTime}</span>
                      <div>
                        <div className="text-sm text-main">{s.title}</div>
                        <div className="text-xs text-sub">{s.coachName || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded px-2 py-0.5 text-xs ${s.busy ? 'bg-red-500/15 text-red-300' : 'bg-gold/10 text-gold'}`}>
                        {s.busy ? 'Занято' : `${s.bookedCount}/${s.capacity}`}
                      </span>
                      <button onClick={() => toggleBusy(s)} className="text-xs text-gold-light hover:underline">
                        {s.busy ? 'Снять' : 'Занято'}
                      </button>
                      <button onClick={() => remove(s)} className="text-xs text-red-400 hover:underline">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WDAY(day: number) {
  return ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'][day - 1] || '';
}
