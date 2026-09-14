'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { toDateKey, formatDateRu } from '@/lib/utils';

type Coach = { id: number; name: string; specialization?: string; color?: string | null };
type ClientLite = {
  id: number;
  name: string;
  photo?: string | null;
  phone: string;
  email?: string | null;
  birthDate?: string | null;
  favoriteCoachId?: number | null;
  favoriteCoach?: { id: number; name: string; color?: string | null } | null;
  _count: { visits: number; memberships: number };
  createdAt: string;
  verified: boolean;
};
type SessionLite = { id: number; title: string; date: string; startTime: string; endTime: string; coachName: string };
type Visit = { id: number; visitedAt: string; note?: string | null; session?: { date: string; startTime: string; title: string } | null; coach?: { name: string; color?: string | null } | null };
type Mem = { id: number; code: string; status: string; totalSessions: number; usedSessions: number; createdAt: string; expiresAt?: string | null };
type Detail = ClientLite & {
  favoriteCoach?: Coach | null;
  visits: Visit[];
  memberships: Mem[];
};

const baseSchema = z.object({
  name: z.string().min(2, 'Укажите имя и фамилию'),
  phone: z.string().min(3, 'Укажите телефон'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  birthDate: z.string().optional(),
  photo: z.string().optional(),
  favoriteCoachId: z.coerce.number().int().optional()
});
type FormData = z.infer<typeof baseSchema>;

function Age({ birthDate }: { birthDate?: string | null }) {
  if (!birthDate) return <span className="text-sub">—</span>;
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return <span>{formatDateRu(d)} · {age} г.</span>;
}

function Avatar({ c, size = 'h-11 w-11' }: { c: { name: string; photo?: string | null; color?: string | null }; size?: string }) {
  return (
    <div className={`${size} relative shrink-0 overflow-hidden rounded-full`} style={{ backgroundColor: c.color || '#2a2a2a' }}>
      {c.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-gold/80">
          {c.name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

const empty: FormData = { name: '', phone: '', email: '', birthDate: '', photo: '', favoriteCoachId: undefined };

export default function ClientsPage() {
  const { data: clients, isLoading } = useSWR<ClientLite[]>('/api/clients', fetcher);
  const { data: coaches } = useSWR<Coach[]>('/api/coaches', fetcher);
  const { data: sessions } = useSWR<SessionLite[]>('/api/sessions?from=2000-01-01&to=2100-12-31', fetcher);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [mode, setMode] = useState<'list' | 'drawer' | null>(null);
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const detailKey = selectedId ? `/api/clients/${selectedId}` : null;
  useSWR<Detail>(detailKey, fetcher, {
    onSuccess: (d) => setSelected(d)
  });
  const openDetail = (id: number) => { setSelectedId(id); setMode('drawer'); setEdit(false); };
  const closeDetail = () => { setSelectedId(null); setSelected(null); setMode('list'); };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients ?? [];
    return (clients ?? []).filter((c) =>
      (c.name + ' ' + (c.phone || '') + ' ' + (c.email || '')).toLowerCase().includes(s)
    );
  }, [clients, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Клиенты</h1>
          <p className="mt-1 text-sm text-sub">Управление клиентской базой · профили, посещения, абонементы</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени/телефону/email"
            className="input-dark w-56 py-2 text-sm" />
          <button onClick={() => { setMode('list'); setEdit(true); setSelectedId(null); setSelected(null); }} className="btn-gold px-4 py-2 text-sm">+ Клиент</button>
        </div>
      </div>

      <div className="card-dark overflow-hidden rounded-2xl">
        {isLoading && <p className="py-10 text-center text-sub">Загрузка...</p>}
        <div className="hidden grid-cols-12 gap-2 border-b border-white/5 px-5 py-3 font-display text-xs tracking-widest text-gold uppercase md:grid">
          <div className="col-span-3">Клиент</div>
          <div className="col-span-2">Телефон</div>
          <div className="col-span-3">ДР / Возраст</div>
          <div className="col-span-2">Любимый тренер</div>
          <div className="col-span-2 text-right">Визиты · Аб-ты</div>
        </div>
        {filtered.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sub">Клиентов не найдено</p>
        )}
        {filtered.map((c) => (
          <button key={c.id} onClick={() => openDetail(c.id)} className="grid w-full grid-cols-2 items-center gap-4 border-b border-white/5 px-5 py-4 text-left transition-colors hover:bg-gold/5 md:grid-cols-12">
            <div className="col-span-2 flex items-center gap-3 md:col-span-3">
              <Avatar c={c} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display tracking-widest uppercase">{c.name}</span>
                  {!c.verified && (
                    <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-amber-300">
                      Непроверено
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-sub">{c.email || '—'}</div>
              </div>
            </div>
            <div className="text-sm text-sub md:col-span-2">{c.phone}</div>
            <div className="hidden text-sm md:col-span-3 md:block"><Age birthDate={c.birthDate} /></div>
            <div className="hidden md:col-span-2 md:block">
              {c.favoriteCoach ? (
                <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: (c.favoriteCoach.color || '#D4AF37') + '22', color: c.favoriteCoach.color || '#D4AF37' }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.favoriteCoach.color || '#D4AF37' }} />{c.favoriteCoach.name}
                </span>
              ) : <span className="text-sub">—</span>}
            </div>
            <div className="text-right text-sm text-gold md:col-span-2">{c._count.visits} · {c._count.memberships}</div>
          </button>
        ))}
      </div>

      {mode === 'drawer' && selected && (
        <ClientDrawer
          client={selected}
          coaches={coaches ?? []}
          sessions={(sessions ?? []).filter((s) => !s.coachName || selected.favoriteCoach?.name !== s.coachName)}
          edit={edit}
          setEdit={setEdit}
          onClose={closeDetail}
          onChanged={() => { mutate('/api/clients'); mutate(detailKey); }}
          onMsg={setMsg}
        />
      )}

      {mode === 'list' && edit && (
        <ClientForm
          coaches={coaches ?? []}
          existing={null}
          onClose={() => setEdit(false)}
          onSaved={() => { mutate('/api/clients'); setEdit(false); }}
        />
      )}
      {msg && <p className="fixed bottom-4 right-4 z-[90] rounded-lg border border-gold/40 bg-black px-4 py-2 text-sm text-gold-light">{msg}</p>}
    </div>
  );
}

function ClientForm({ coaches, existing, onClose, onSaved }: { coaches: Coach[]; existing: Detail | null; onClose: () => void; onSaved: () => void }) {
  const initial: FormData = existing ? {
    name: existing.name,
    phone: existing.phone,
    email: existing.email ?? '',
    birthDate: existing.birthDate ? toDateKey(new Date(existing.birthDate)) : '',
    photo: existing.photo ?? '',
    favoriteCoachId: existing.favoriteCoachId ?? undefined
  } : empty;
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(baseSchema), defaultValues: initial });
  const photo = watch('photo');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const form = new FormData(); form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(body.error || 'Ошибка загрузки'); return; }
    setValue('photo', body.url);
  };

  const submit = async (data: FormData) => {
    setSaving(true); setErr(null);
    try {
      if (existing) await patchJSON(`/api/clients/${existing.id}`, data);
      else await postJSON('/api/clients', data);
      reset(empty); onSaved();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const fileId = toDateKey(new Date());
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit(submit)} className="card-dark max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg tracking-widest uppercase text-gold">{existing ? 'Редактировать клиента' : 'Новый клиент'}</h3>
        <div className="mt-4 space-y-4">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="foto" className="h-24 w-24 rounded-full border border-gold/40 object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/20 text-sub">Фото</div>
          )}
          <label className="btn-ghost inline-block px-4 py-2 text-sm">
            Загрузить фото
            <input type="file" accept="image/*" className="hidden" key={fileId} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-dark">Имя и фамилия *</label>
              <input className="input-dark" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label-dark">Телефон *</label>
              <input className="input-dark" placeholder="+375 ..." {...register('phone')} />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label-dark">Email</label>
              <input type="email" className="input-dark" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label-dark">Дата рождения</label>
              <input type="date" className="input-dark" {...register('birthDate')} />
            </div>
            <div className="col-span-2">
              <label className="label-dark">Любимый тренер</label>
              <select className="input-dark" {...register('favoriteCoachId')}>
                <option value="">— нет —</option>
                {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex gap-3">
            <button className="btn-gold flex-1 px-5 py-3 text-sm" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            <button type="button" className="btn-ghost px-4 py-3 text-sm" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ClientDrawer({ client, coaches, sessions, edit, setEdit, onClose, onChanged, onMsg }: {
  client: Detail;
  coaches: Coach[];
  sessions: SessionLite[];
  edit: boolean;
  setEdit: (e: boolean) => void;
  onClose: () => void;
  onChanged: () => void;
  onMsg: (m: string) => void;
}) {
  const [tab, setTab] = useState<'overview' | 'visits' | 'memberships'>('overview');
  const [addVisit, setAddVisit] = useState(false);
  const [visit, setVisit] = useState({ visitedAt: toDateKey(new Date()), sessionId: '', coachId: '', note: '' });
  const [memEstimate, setMemEstimate] = useState(false);

  const activeMems = client.memberships.filter((m) => m.status === 'ACTIVE');
  const remaining = activeMems.reduce((a, m) => a + Math.max(0, m.totalSessions - m.usedSessions), 0);
  const stats = [
    { label: 'Посещений', value: client.visits.length },
    { label: 'Абонементов', value: client.memberships.length },
    { label: 'Осталось занятий', value: remaining },
    { label: 'В клубе с', value: new Date(client.createdAt).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }) }
  ];

  const addVisitFn = async () => {
    try {
      await postJSON(`/api/clients/${client.id}/visits`, {
        visitedAt: visit.visitedAt,
        sessionId: visit.sessionId ? Number(visit.sessionId) : null,
        coachId: visit.coachId ? Number(visit.coachId) : null,
        note: visit.note || null
      });
      setAddVisit(false);
      setVisit({ visitedAt: toDateKey(new Date()), sessionId: '', coachId: '', note: '' });
      onChanged(); onMsg('Посещение добавлено');
    } catch (e: any) { onMsg(e.message); }
  };

  const delClient = async () => {
    if (!confirm('Удалить клиента и его историю?')) return;
    await del(`/api/clients/${client.id}`);
    mutate('/api/clients');
    onClose();
  };

  const markVerified = async () => {
    await patchJSON(`/api/clients/${client.id}`, { verified: true });
    onChanged();
    onMsg('Клиент отмечен проверенным');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60" onClick={onClose}>
      <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-[#0d0d0d] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar c={client} size="h-14 w-14" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-lg font-bold tracking-widest uppercase">{client.name}</span>
                {!client.verified && (
                  <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">
                    Непроверено
                  </span>
                )}
              </div>
              <div className="truncate text-sm text-sub">{client.phone}{client.email ? ` · ${client.email}` : ''}</div>
              <div className="text-sm mt-0.5"><Age birthDate={client.birthDate} /></div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg text-sub transition-colors hover:border-gold hover:text-gold"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2">
          {!client.verified && (
            <button onClick={markVerified} className="btn-gold px-3 py-1.5 text-xs">Отметить проверенным</button>
          )}
          <button onClick={() => setEdit(true)} className="btn-ghost px-3 py-1.5 text-xs">Редактировать</button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-white/5 p-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-white/5 bg-black/30 p-3">
              <div className="font-display text-2xl font-bold gold-text">{s.value}</div>
              <div className="text-xs text-sub">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-white/5 px-5 py-3">
          <div className="flex gap-1">
            {(['overview', 'visits', 'memberships'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`tab-gold px-4 py-2 font-display text-sm tracking-widest uppercase ${tab === t ? 'active text-gold' : 'text-sub'}`}>
                {t === 'overview' ? 'Обзор' : t === 'visits' ? 'Посещения' : 'Абонементы'}
              </button>
            ))}
          </div>
          <span className="font-display text-xs tracking-widest text-gold/60 uppercase">Клиент · #{client.id}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-white/5 bg-black/30 p-5">
                <h4 className="font-display tracking-widest uppercase text-gold">Любимый тренер</h4>
                {client.favoriteCoach ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar c={client.favoriteCoach} size="h-12 w-12" />
                    <div>
                      <div className="text-main">{client.favoriteCoach.name}</div>
                      <div className="text-sm text-sub">{client.favoriteCoach.specialization || 'Тренер клуба'}</div>
                    </div>
                  </div>
                ) : <p className="mt-3 text-sub">Не указан</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setAddVisit(true)} className="btn-gold px-5 py-3 text-sm">+ Отметить посещение</button>
                <button onClick={() => setMemEstimate(true)} className="btn-ghost px-5 py-3 text-sm">Создать абонемент</button>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/30 p-5 text-sm">
                <div className="text-xs text-sub">Последнее посещение</div>
                <div className="mt-1 text-main">{client.visits[0] ? formatDateRu(new Date(client.visits[0].visitedAt)) + ' · ' + (client.visits[0].session?.title || 'Тренировка') : 'Ещё не было'}</div>
              </div>
            </div>
          )}

          {tab === 'visits' && (
            <div className="space-y-3">
              {client.visits.length === 0 && <p className="py-8 text-center text-sub">Посещений пока нет</p>}
              {client.visits.map((v) => (
                <div key={v.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/30 p-4">
                  <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display tracking-widest uppercase">{v.session?.title || 'Тренировка'}</span>
                      <span className="text-xs text-sub">{formatDateRu(new Date(v.visitedAt))}</span>
                    </div>
                    <div className="mt-1 text-sm text-sub">
                      {v.session?.date ? `${new Date(v.session.date).toLocaleDateString('ru-RU')} · ${v.session.startTime}` : ''}
                      {v.coach ? ` · ${v.coach.name}` : ''}
                    </div>
                    {v.note && <p className="mt-1 text-sm text-main">{v.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'memberships' && (
            <div className="space-y-3">
              {client.memberships.length === 0 && <p className="py-8 text-center text-sub">Абонементов пока нет</p>}
              {client.memberships.map((m) => {
                const left = Math.max(0, m.totalSessions - m.usedSessions);
                return (
                  <div key={m.id} className="rounded-lg border border-white/5 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-sub">{m.code}</span>
                      <span className={`rounded px-2 py-0.5 text-xs ${m.status === 'ACTIVE' ? 'bg-gold/10 text-gold' : 'bg-white/10 text-sub'}`}>
                        {m.status === 'ACTIVE' ? 'Активен' : 'Завершён'}
                      </span>
                    </div>
                    <div className="mt-2 font-display text-lg text-main">{left} из {m.totalSessions} занятий</div>
                    <div className="mt-1 text-xs text-sub">Куплен {formatDateRu(new Date(m.createdAt))}{m.expiresAt ? ` · до ${formatDateRu(new Date(m.expiresAt))}` : ''}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 p-4">
          <span className="text-xs text-sub">Абонементов: {client.memberships.length} · Визитов: {client.visits.length}</span>
          <button onClick={delClient} className="text-sm text-red-400 hover:underline">Удалить клиента</button>
        </div>
      </div>

      {edit && (
        <ClientForm coaches={coaches} existing={client} onClose={() => setEdit(false)}
          onSaved={() => { onChanged(); setEdit(false); onMsg('Сохранено'); }} />
      )}

      {addVisit && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4" onClick={() => setAddVisit(false)}>
          <div className="card-dark w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg tracking-widest uppercase text-gold">Отметить посещение</h3>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Дата</label>
                  <input type="date" value={visit.visitedAt} onChange={(e) => setVisit({ ...visit, visitedAt: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="label-dark">Тренер</label>
                  <select value={visit.coachId} onChange={(e) => setVisit({ ...visit, coachId: e.target.value })} className="input-dark">
                    <option value="">— считать с абонемента —</option>
                    {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-dark">Слот записи</label>
                <select value={visit.sessionId} onChange={(e) => setVisit({ ...visit, sessionId: e.target.value })} className="input-dark">
                  <option value="">— без привязки —</option>
                  {sessions.map((s) => (<option key={s.id} value={s.id}>{toDateKey(new Date(s.date))} {s?.startTime ?? ''} · {s.title}{s.coachName ? ` · ${s.coachName}` : ''}</option>))}
                </select>
              </div>
              <div>
                <label className="label-dark">Заметка</label>
                <input value={visit.note} onChange={(e) => setVisit({ ...visit, note: e.target.value })} className="input-dark" />
              </div>
              <button onClick={addVisitFn} className="btn-gold w-full px-5 py-3 text-sm">Добавить</button>
            </div>
          </div>
        </div>
      )}
      {memEstimate && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4" onClick={() => setMemEstimate(false)}>
          <div className="card-dark w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg tracking-widest uppercase text-gold">Новый абонемент</h3>
            <div className="mt-4 space-y-3 text-sm text-sub">
              <p className="rounded-lg border border-white/5 bg-black/30 p-4">
                Создать абонемент на <b className="text-main">4 занятия</b> для <b className="text-main">{client.name}</b> и привязать к истории клиента?
              </p>
              <div className="flex gap-3">
                <button className="btn-gold flex-1 px-5 py-3 text-sm" onClick={async () => {
                  await postJSON('/api/memberships', { holderName: client.name, phone: client.phone, totalSessions: 4, clientId: client.id });
                  mutate('/api/memberships'); onChanged(); setMemEstimate(false); onMsg('Абонемент создан и привязан');
                }}>Создать</button>
                <button className="btn-ghost px-4 py-3 text-sm" onClick={() => setMemEstimate(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
