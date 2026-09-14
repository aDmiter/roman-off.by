'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetcher, postJSON, del } from '@/lib/api';
import { DEFAULT_TOTAL_SESSIONS } from '@/lib/constants';

const schema = z.object({
  holderName: z.string().min(2, 'Укажите имя'),
  phone: z.string().min(3, 'Укажите телефон'),
  clientId: z.coerce.number().int().optional(),
  membershipTypeId: z.string().min(1, 'Выберите вид абонемента')
});

type FormData = z.infer<typeof schema>;
type Client = { id: number; name: string; phone: string; email?: string | null };
type MembershipType = { id: number; name: string; sessions: number; price: number; durationDays: number };
type Membership = {
  id: number;
  code: string;
  holderName: string;
  phone: string;
  typeName?: string | null;
  price?: number | null;
  membershipTypeId?: number | null;
  totalSessions: number;
  usedSessions: number;
  remaining: number;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  usages?: string[];
  barcode: string;
};

const empty: FormData = { holderName: '', phone: '', clientId: undefined, membershipTypeId: '' };

export default function MembershipsPage() {
  const { data: memberships, isLoading } = useSWR<Membership[]>('/api/memberships', fetcher);
  const { data: clients, mutate: mutateClients } = useSWR<Client[]>('/api/clients', fetcher);
  const { data: membershipTypes } = useSWR<MembershipType[]>('/api/membership-types', fetcher);
  const [newCard, setNewCard] = useState<Membership | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [renewFor, setRenewFor] = useState<Membership | null>(null);
  const [renewTypeId, setRenewTypeId] = useState('');
  const [renewErr, setRenewErr] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newErr, setNewErr] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty
  });

  const selectedType = (membershipTypes ?? []).find((t) => t.id === Number(watch('membershipTypeId')));

  const filtered = (clients ?? []).filter((c) => {
    const s = query.trim().toLowerCase();
    if (!s) return false;
    return c.name.toLowerCase().includes(s) || (c.phone || '').includes(s);
  });

  const selectClient = (c: Client) => {
    setSelectedClient(c);
    setValue('holderName', c.name);
    setValue('phone', c.phone);
    setValue('clientId', c.id);
    setQuery('');
    setNewErr(null);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setValue('holderName', '');
    setValue('phone', '');
    setValue('clientId', undefined);
    setQuery('');
  };

  const createClient = async () => {
    setNewErr(null);
    if (newName.trim().length < 2) { setNewErr('Укажите имя и фамилию'); return; }
    if (newPhone.trim().length < 3) { setNewErr('Укажите телефон'); return; }
    try {
      const created = await postJSON<Client>('/api/clients', { name: newName.trim(), phone: newPhone.trim() });
      mutateClients();
      selectClient(created);
      setNewName('');
      setNewPhone('');
    } catch (e: any) {
      setNewErr(e.message);
    }
  };

  const submit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await postJSON('/api/memberships', data);
      setNewCard(res);
      reset(empty);
      setSelectedClient(null);
      setQuery('');
      mutate('/api/memberships');
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить абонемент?')) return;
    await del(`/api/memberships/${id}`);
    mutate('/api/memberships');
  };

  const printCard = (m: Membership) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Абонемент</title></head>
<body style="font-family:Roboto,Arial,sans-serif;background:#0a0a0a;color:#fff;display:flex;justify-content:center;padding:40px;">
<div style="width:340px;border:2px solid #d4af37;border-radius:12px;padding:24px;background:linear-gradient(160deg,#1a1a1a,#0a0a0a);">
<div style="text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;color:#d4af37;">ROMANOFF FIGHT CLUB</div>
<div style="text-align:center;color:#b0b0b0;font-size:12px;letter-spacing:3px;margin-top:4px;">АБОНЕМЕНТ · ${m.totalSessions} ЗАНЯТИЙ</div>
<div style="margin-top:18px;color:#fff;font-size:15px;">${m.holderName}</div>
<div style="color:#b0b0b0;font-size:13px;margin-top:2px;">${m.phone}</div>
<div style="margin-top:12px;display:flex;gap:8px;font-size:13px;"><span style="color:#d4af37;">Осталось:</span><span style="color:#fff;">${m.remaining}</span><span style="color:#d4af37;">|</span><span style="color:#d4af37;">Код:</span><span style="color:#fff;">${m.code}</span></div>
<img src="${m.barcode}" style="margin-top:16px;width:100%;" />
</div>
</body></html>`);
    win.document.close();
    win.focus();
  };

  const shareLink = async (m: Membership) => {
    const url = `${window.location.origin}/${m.code.toLowerCase()}`;
    const nav = navigator as any;
    if (nav.share) {
      try {
        await nav.share({
          title: 'Абонемент ROMANOFF FIGHT CLUB',
          text: `Абонемент ROMANOFF FIGHT CLUB — ${m.holderName}. Осталось занятий: ${m.remaining}.`,
          url
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Ссылка скопирована в буфер обмена');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(null), 5000);
  };

  const useSession = async (m: Membership) => {
    if (!confirm(`Списать одно занятие с абонемента «${m.holderName}»?`)) return;
    setActionBusy(true);
    try {
      await postJSON(`/api/memberships/${m.id}/use`, {});
      mutate('/api/memberships');
      setShareMsg(`Списано занятие · ${m.holderName}`);
    } catch (e: any) {
      setShareMsg(e.message);
    } finally {
      setActionBusy(false);
      setTimeout(() => setShareMsg(null), 5000);
    }
  };

  const renewOptions = (membershipTypes ?? []).filter((t) => !renewFor?.typeName || t.name === renewFor.typeName);

  const doRenew = async () => {
    if (!renewFor) return;
    if (!renewTypeId) { setRenewErr('Выберите вид абонемента'); return; }
    setActionBusy(true);
    setRenewErr(null);
    try {
      await postJSON(`/api/memberships/${renewFor.id}/renew`, { membershipTypeId: renewTypeId });
      mutate('/api/memberships');
      setRenewFor(null);
      setRenewTypeId('');
      setShareMsg('Абонемент продлён');
      setTimeout(() => setShareMsg(null), 5000);
    } catch (e: any) {
      setRenewErr(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const c = newCard;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Абонементы</h1>
          <p className="mt-1 text-sm text-sub">Создание, списание, продление и печать абонементов</p>
        </div>
        <a href="/admin/scan" className="btn-ghost px-4 py-2 text-sm">Сканировать абонемент</a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <form onSubmit={handleSubmit(submit)} className="card-dark rounded-2xl p-6">
            <h2 className="mb-4 font-display text-base tracking-widest uppercase text-gold">Создать абонемент</h2>
            <div className="space-y-4">
              {/* Client selector at the top */}
              <div>
                <label className="label-dark">Клиент</label>
                {selectedClient ? (
                  <div className="flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-display tracking-widest uppercase text-main">{selectedClient.name}</div>
                      <div className="text-xs text-sub">{selectedClient.phone}</div>
                    </div>
                    <button type="button" onClick={clearClient} className="text-xs text-red-400 hover:underline">Сменить</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Найти клиента по имени или телефону..."
                      className="input-dark"
                    />
                    {query.trim() && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-black/95 p-2 shadow-card">
                        {filtered.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectClient(c)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gold/10"
                          >
                            <span className="text-sm text-main">{c.name}</span>
                            <span className="text-xs text-sub">{c.phone}</span>
                          </button>
                        ))}
                        {filtered.length === 0 && (
                          <div className="space-y-2 p-2">
                            <p className="text-xs text-sub">Клиент не найден — создайте нового:</p>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя и фамилия *" className="input-dark text-sm" />
                            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Телефон *" className="input-dark text-sm" />
                            {newErr && <p className="text-xs text-red-400">{newErr}</p>}
                            <button type="button" onClick={createClient} className="btn-gold w-full px-4 py-2 text-sm">Создать клиента</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedClient && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-dark">Имя / ФИО</label>
                    <input className="input-dark" placeholder="Иван Иванов" {...register('holderName')} />
                    {errors.holderName && <p className="mt-1 text-xs text-red-400">{errors.holderName.message}</p>}
                  </div>
                  <div>
                    <label className="label-dark">Телефон</label>
                    <input className="input-dark" placeholder="+375 29 ..." {...register('phone')} />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="label-dark">Вид абонемента</label>
                <select className="input-dark" {...register('membershipTypeId')}>
                  <option value="">— выберите вид —</option>
                  {(membershipTypes ?? []).map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.name} · {t.sessions} занятий · {t.price} BYN</option>
                  ))}
                </select>
                {errors.membershipTypeId && <p className="mt-1 text-xs text-red-400">{errors.membershipTypeId.message}</p>}
              </div>

              {selectedType && (
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-center">
                  <div>
                    <div className="font-display text-lg text-gold">{selectedType.sessions}</div>
                    <div className="text-xs text-sub">занятий</div>
                  </div>
                  <div>
                    <div className="font-display text-lg text-gold">{selectedType.price}</div>
                    <div className="text-xs text-sub">BYN</div>
                  </div>
                  <div>
                    <div className="font-display text-lg text-gold">{selectedType.durationDays}</div>
                    <div className="text-xs text-sub">дней</div>
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button disabled={loading} className="btn-gold w-full px-5 py-3 text-sm">
                {loading ? 'Создаём...' : 'Сгенерировать абонемент'}
              </button>
            </div>
          </form>

          {c && (
            <div className="card-dark rounded-2xl p-6">
              <h2 className="mb-4 font-display text-base tracking-widest uppercase text-gold">Новый абонемент</h2>
              <div className="rounded-xl border border-gold/50 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-5">
                <div className="text-center font-display text-lg font-bold tracking-widest text-gold">ROMANOFF</div>
                <div className="text-center text-xs tracking-widest text-sub">FIGHT CLUB · {c.totalSessions} ЗАНЯТИЙ</div>
                {c.typeName && <div className="mt-1 text-center text-sm text-gold-light">{c.typeName}</div>}
                <div className="mt-4 text-main">{c.holderName}</div>
                <div className="text-sm text-sub">{c.phone}</div>
                <div className="mt-3 flex justify-between text-sm"><span className="text-gold">Осталось</span><span className="text-main">{c.remaining}</span></div>
                <img src={c.barcode} alt="Штрихкод" className="mt-3 w-full rounded" />
                <div className="mt-2 break-all text-center font-mono text-xs text-sub">{c.code}</div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => printCard(c)} className="btn-ghost flex-1 px-4 py-3 text-sm">Печать / карточка</button>
                <button onClick={() => shareLink(c)} className="btn-ghost flex-1 px-4 py-3 text-sm">Отправить ссылку</button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {(memberships ?? []).map((m) => {
              const usedUp = m.remaining <= 0;
              return (
                <div key={m.id} className="card-dark rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`font-display tracking-widest uppercase ${usedUp ? 'text-sub' : 'text-main'}`}>{m.holderName}</div>
                      <div className="text-xs text-sub">{m.phone}</div>
                      {m.typeName && <div className="text-xs text-gold-light">{m.typeName} · {m.totalSessions} занятий</div>}
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${m.status === 'ACTIVE' ? 'bg-gold/10 text-gold' : 'bg-red-500/15 text-red-300'}`}>
                      {m.remaining}/{m.totalSessions}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="font-display text-3xl font-bold gold-text">{m.remaining}</span>
                    <span className="mb-1 text-xs text-sub">занятий осталось</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-sub">
                    {m.expiresAt && <div>Действует до {new Date(m.expiresAt).toLocaleDateString('ru-RU')}</div>}
                    {m.usages && m.usages.length > 0 && (
                      <div>
                        Списания: {m.usages.slice(0, 6).map((u) => new Date(u).toLocaleDateString('ru-RU')).join(', ')}
                        {m.usages.length > 6 ? ` +${m.usages.length - 6}` : ''}
                      </div>
                    )}
                  </div>
                  <img src={m.barcode} alt="Barcode" className="mt-3 w-full rounded bg-white p-1" />
                  <div className="mt-2 break-all font-mono text-[11px] text-sub">{m.code}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {m.remaining > 0 && m.status === 'ACTIVE' && (
                      <button onClick={() => useSession(m)} disabled={actionBusy} className="btn-gold flex-1 px-3 py-2 text-xs">
                        Списать занятие
                      </button>
                    )}
                    <button
                      onClick={() => { setRenewFor(m); setRenewTypeId(''); setRenewErr(null); }}
                      disabled={actionBusy}
                      className="btn-ghost flex-1 px-3 py-2 text-xs"
                    >
                      Продлить
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={() => printCard(m)} className="btn-ghost flex-1 px-3 py-2 text-xs">Печать</button>
                    <button onClick={() => shareLink(m)} className="btn-ghost flex-1 px-3 py-2 text-xs">Отправить ссылку</button>
                    <button onClick={() => remove(m.id)} className="px-3 py-2 text-xs text-red-400 hover:underline">Удалить</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {renewFor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={() => setRenewFor(null)}>
          <div className="card-dark max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg tracking-widest uppercase text-gold">Продлить абонемент</h3>
            <p className="mt-1 text-sm text-sub">{renewFor.holderName} · {renewFor.code}</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label-dark">Вид занятия (не меняется)</label>
                <div className="input-dark opacity-70">{renewFor.typeName || '—'}</div>
              </div>
              <div>
                <label className="label-dark">Вид абонемента</label>
                <select className="input-dark" value={renewTypeId} onChange={(e) => setRenewTypeId(e.target.value)}>
                  <option value="">— выберите —</option>
                  {renewOptions.map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.sessions} занятий · {t.price} BYN · {t.durationDays} дней</option>
                  ))}
                </select>
                {renewOptions.length === 0 && (
                  <p className="mt-1 text-xs text-red-400">Нет видов абонементов для этого занятия. Добавьте их в Настройках.</p>
                )}
              </div>
              <div className="rounded-lg border border-white/5 bg-black/30 p-3 text-xs text-sub">
                Добавятся выбранные занятия и продлится срок действия. Код и штрихкод не меняются.
              </div>
              {renewErr && <p className="text-sm text-red-400">{renewErr}</p>}
              <div className="flex gap-3">
                <button onClick={doRenew} disabled={actionBusy} className="btn-gold flex-1 px-5 py-3 text-sm">
                  {actionBusy ? 'Продлеваем...' : 'Продлить'}
                </button>
                <button onClick={() => setRenewFor(null)} className="btn-ghost px-4 py-3 text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareMsg && (
        <p className="fixed bottom-4 right-4 z-[90] max-w-xs break-all rounded-lg border border-gold/40 bg-black px-4 py-2 text-sm text-gold-light">
          {shareMsg}
        </p>
      )}
    </div>
  );
}
