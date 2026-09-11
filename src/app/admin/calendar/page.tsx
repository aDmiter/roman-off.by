'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { toDateKey } from '@/lib/utils';

type Session = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  coachName: string;
  coachId: number | null;
  capacity: number;
  bookedCount: number;
  busy: boolean;
  note?: string | null;
  coach?: { id: number; name: string; color?: string | null; photo?: string | null } | null;
};
type Coach = { id: number; name: string; specialization: string; color?: string | null };
type LessonType = { id: number; name: string; durationMinutes: number };
type WorkHours = { dayOfWeek: number; openTime: string; closeTime: string };
type Modal = { mode: 'create' | 'view'; session?: Session; date?: string; coachId?: number };

export default function CalendarPage() {
  const ALL = '?from=2000-01-01&to=2100-12-31';
  const { data: sessions } = useSWR<Session[]>(`/api/sessions${ALL}`, fetcher, { revalidateOnFocus: false });
  const { data: coaches } = useSWR<Coach[]>('/api/coaches', fetcher);
  const { data: lessonTypes } = useSWR<LessonType[]>('/api/lesson-types', fetcher);
  const { data: workHours } = useSWR<WorkHours[]>('/api/working-hours', fetcher);
  const [filterCoach, setFilterCoach] = useState<number | 'all'>('all');
  const [modal, setModal] = useState<Modal | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const calRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('timeGridDay');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      setModal({ mode: 'create' });
      window.history.replaceState(null, '', '/admin/calendar');
    }
  }, []);

  const changeMobileView = (view: string) => {
    setMobileView(view);
    calRef.current?.getApi().changeView(view);
  };

  const goToday = () => calRef.current?.getApi().today();

  const visibleSessions = (sessions ?? []).filter((s) => filterCoach === 'all' || s.coachId === filterCoach);

  const events: EventInput[] = useMemo(
    () =>
      visibleSessions.map((s) => {
        const key = toDateKey(new Date(s.date));
        const color = s.busy ? '#7f2b2b' : s.coach?.color || '#D4AF37';
        return {
          id: String(s.id),
          title: `${s.title}${s.coachName ? ' · ' + s.coachName : ''}`,
          className: s.busy ? 'rfc-busy' : '',
          backgroundColor: color,
          borderColor: color,
          textColor: '#0a0a0a',
          start: `${key}T${s.startTime}:00`,
          end: `${key}T${s.endTime}:00`,
          extendedProps: { session: s }
        };
      }),
    [visibleSessions]
  );

  const reload = () => mutate(`/api/sessions${ALL}`);

  const onDateClick = (info: DateClickArg) => {
    const day = toDateKey(info.date);
    setModal({ mode: 'create', date: day, coachId: filterCoach === 'all' ? undefined : filterCoach });
  };

  const onEventClick = (info: EventClickArg) => {
    const session = (info.event.extendedProps as any).session as Session;
    setModal({ mode: 'view', session });
  };

  const toggleBusy = async (s: Session) => {
    await patchJSON(`/api/sessions/${s.id}`, { busy: !s.busy });
    reload();
    setModal(null);
  };

  const removeSession = async (s: Session) => {
    if (!confirm(`Удалить «${s.title}» ${toDateKey(new Date(s.date))} ${s.startTime}?`)) return;
    await del(`/api/sessions/${s.id}`);
    reload();
    setModal(null);
  };

  const createSession = async (d: { date: string; startTime: string; endTime: string; title: string; coachId: number }) => {
    try {
      await postJSON('/api/sessions', { ...d, coachId: d.coachId });
      reload();
      setModal(null);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Календарь</h1>
          <p className="mt-1 hidden text-sm text-sub sm:block">Записи всех тренеров · нажмите на слот, чтобы создать запись</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
            <select
              value={filterCoach}
              onChange={(e) => setFilterCoach(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="input-dark py-2 text-sm"
            >
              <option value="all">Все тренеры</option>
              {(coaches ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setModal({ mode: 'create' })} className="btn-gold whitespace-nowrap px-4 py-2 text-sm">+ Запись</button>
        </div>
      </div>
      {msg && <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-gold-light">{msg}</p>}

      {isMobile && (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <select
              value={mobileView}
              onChange={(e) => changeMobileView(e.target.value)}
              className="input-dark py-2 text-sm"
            >
              <option value="timeGridDay">День</option>
              <option value="timeGridWeek">Неделя</option>
              <option value="dayGridMonth">Месяц</option>
              <option value="listWeek">Список</option>
            </select>
          </div>
          <button onClick={goToday} className="btn-ghost whitespace-nowrap px-4 py-2 text-sm">Сегодня</button>
        </div>
      )}

      <div className="card-dark overflow-hidden rounded-2xl p-1 sm:p-2">
        <FullCalendar
          key={isMobile ? 'mobile' : 'desktop'}
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          headerToolbar={
            isMobile
              ? { left: 'prev,next', center: 'title', right: '' }
              : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }
          }
          initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
          locale="ru"
          locales={[ruLocale]}
          firstDay={1}
          nowIndicator
          selectable
          dayMaxEvents
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          allDaySlot={false}
          expandRows
          scrollTime="08:00:00"
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
        />
      </div>

      {modal?.mode === 'create' && (
        <CreateModal
          key={modal.date ?? 'x'}
          initial={modal}
          coaches={coaches ?? []}
          lessonTypes={lessonTypes ?? []}
          workHours={workHours ?? []}
          sessions={sessions ?? []}
          onSubmit={createSession}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === 'view' && modal.session && (
        <ViewModal session={modal.session} onClose={() => setModal(null)} onToggleBusy={toggleBusy} onDelete={removeSession} />
      )}
    </div>
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function weekdayOf(dateKey: string): number {
  const dow = new Date(`${dateKey}T00:00:00`).getDay(); // 0 = Вс
  return dow === 0 ? 7 : dow;
}

const SLOT_STEP = 30; // получасовой интервал

function CreateModal({ initial, coaches, lessonTypes, workHours, sessions, onSubmit, onClose }: {
  initial: Modal;
  coaches: Coach[];
  lessonTypes: LessonType[];
  workHours: WorkHours[];
  sessions: Session[];
  onSubmit: (d: { date: string; startTime: string; endTime: string; title: string; coachId: number }) => void;
  onClose: () => void;
}) {
  const [coachId, setCoachId] = useState<number | ''>(initial.coachId ?? '');
  const [lessonTypeId, setLessonTypeId] = useState<number | ''>('');
  const [date, setDate] = useState(initial.date ?? toDateKey(new Date()));
  const [startTime, setStartTime] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const lesson = lessonTypes.find((l) => l.id === lessonTypeId) || null;
  const duration = lesson?.durationMinutes ?? 0;
  const workDay = workHours.find((w) => w.dayOfWeek === weekdayOf(date));

  const occupied = useMemo(() => {
    if (!coachId) return [] as { start: number; end: number }[];
    return sessions
      .filter((s) => s.coachId === coachId && toDateKey(new Date(s.date)) === date)
      .map((s) => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }));
  }, [sessions, coachId, date]);

  const slots = useMemo(() => {
    if (!duration) return [] as string[];
    const wh = workHours.find((w) => w.dayOfWeek === weekdayOf(date));
    if (!wh) return [] as string[];
    const open = timeToMinutes(wh.openTime);
    const close = timeToMinutes(wh.closeTime);
    const out: string[] = [];
    for (let m = open; m + duration <= close; m += SLOT_STEP) {
      const overlaps = occupied.some((o) => m < o.end && m + duration > o.start);
      if (!overlaps) out.push(minutesToTime(m));
    }
    return out;
  }, [duration, date, workHours, occupied]);

  const endTime = startTime && duration ? minutesToTime(timeToMinutes(startTime) + duration) : '';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card-dark max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg tracking-widest uppercase text-gold">Новая запись</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label-dark">1. Тренер</label>
            <select value={coachId} onChange={(e) => { setCoachId(e.target.value === '' ? '' : Number(e.target.value)); setStartTime(''); }} className="input-dark">
              <option value="">— выберите тренера —</option>
              {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          <div>
            <label className="label-dark">2. Занятие</label>
            <select value={lessonTypeId} onChange={(e) => { setLessonTypeId(e.target.value === '' ? '' : Number(e.target.value)); setStartTime(''); }} className="input-dark" disabled={coachId === ''}>
              <option value="">— выберите занятие —</option>
              {lessonTypes.map((l) => (<option key={l.id} value={l.id}>{l.name} · {l.durationMinutes} мин</option>))}
            </select>
          </div>

          <div>
            <label className="label-dark">3. Дата</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setStartTime(''); }} className="input-dark" disabled={lessonTypeId === ''} />
          </div>

          <div>
            <label className="label-dark">4. Время начала</label>
            {!duration || !workDay ? (
              <p className="rounded-lg border border-white/5 bg-black/30 px-4 py-3 text-sm text-sub">
                {!workDay ? 'В этот день клуб не работает' : 'Выберите занятие и дату'}
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Нет свободных слотов ({workDay.openTime}–{workDay.closeTime})
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStartTime(s)}
                    className={`rounded-lg border px-3 py-2 font-display text-sm tracking-widest transition-colors ${startTime === s ? 'border-gold bg-gold text-black' : 'border-white/10 text-main hover:border-gold/60'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {startTime && duration > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
              <span className="text-sub">Время занятия</span>
              <span className="font-display tracking-widest text-gold">{startTime}–{endTime}</span>
            </div>
          )}

          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex gap-3">
            <button className="btn-gold flex-1 px-5 py-3 text-sm" onClick={() => {
              if (coachId === '' || !lesson || !startTime) { setErr('Выберите тренера, занятие и время'); return; }
              onSubmit({ date, startTime, endTime, title: lesson.name, coachId });
            }}>Создать</button>
            <button className="btn-ghost px-4 py-3 text-sm" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ session, onClose, onToggleBusy, onDelete }: {
  session: Session;
  onClose: () => void;
  onToggleBusy: (s: Session) => void;
  onDelete: (s: Session) => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card-dark w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg tracking-widest uppercase text-gold">{session.title}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-sub">Дата</div><div className="text-main">{toDateKey(new Date(session.date))}</div></div>
          <div><div className="text-xs text-sub">Время</div><div className="text-main">{session.startTime}–{session.endTime}</div></div>
          <div><div className="text-xs text-sub">Тренер</div><div className="text-main">{session.coachName || session.coach?.name || '—'}</div></div>
          <div><div className="text-xs text-sub">Записи</div><div className="text-main">{session.bookedCount}/{session.capacity}</div></div>
        </div>
        <div className={`mt-4 rounded-lg px-4 py-2 text-center text-sm ${session.busy ? 'bg-red-500/15 text-red-300' : 'bg-gold/10 text-gold'}`}>
          {session.busy ? 'Слот отмечен как «занято»' : 'Открыт для записи'}
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => onToggleBusy(session)} className="btn-ghost flex-1 px-4 py-3 text-sm">{session.busy ? 'Открыть' : 'Занято'}</button>
          <button onClick={() => onDelete(session)} className="btn-gold flex-1 px-4 py-3 text-sm">Удалить</button>
        </div>
      </div>
    </div>
  );
}
