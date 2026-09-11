'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { mutate } from 'swr';
import { fetcher, postJSON, patchJSON, del } from '@/lib/api';
import { ADMIN_SECTIONS } from '@/lib/constants';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPERADMIN' | 'STAFF';
  active: boolean;
  createdAt: string;
  permissions: string[];
};
type Me = { user: { name: string; email: string; role: string; phone: string }; permissions: string[] };

type Form = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'SUPERADMIN' | 'STAFF';
  active: boolean;
  permissions: string[];
};

const emptyForm: Form = { name: '', email: '', phone: '', password: '', role: 'STAFF', active: true, permissions: [] };

export default function UsersPage() {
  const { data: users, isLoading } = useSWR<AdminUser[]>('/api/admin/users', fetcher);
  const { data: me } = useSWR<Me>('/api/admin/me', fetcher);
  const callerIsSuper = me?.user.role === 'SUPERADMIN';

  const [modal, setModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [form, setForm] = useState<Form>(emptyForm);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setForm(emptyForm); setErr(null); setModal({ open: true, id: null }); };
  const openEdit = (u: AdminUser) => {
    setForm({
      name: u.name, email: u.email, phone: u.phone, password: '',
      role: u.role, active: u.active, permissions: u.permissions
    });
    setErr(null);
    setModal({ open: true, id: u.id });
  };
  const close = () => setModal({ open: false, id: null });

  const togglePerm = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key]
    }));
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        active: form.active,
        permissions: form.role === 'SUPERADMIN' ? [] : form.permissions
      };
      if (form.password.trim()) payload.password = form.password;
      if (modal.id) {
        await patchJSON(`/api/admin/users/${modal.id}`, payload);
      } else {
        if (!form.password.trim()) { setErr('Пароль обязателен при создании'); setSaving(false); return; }
        await postJSON('/api/admin/users', payload);
      }
      mutate('/api/admin/users');
      close();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Удалить пользователя «${u.name}»?`)) return;
    try {
      await del(`/api/admin/users/${u.id}`);
      mutate('/api/admin/users');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Пользователи</h1>
          <p className="mt-1 text-sm text-sub">Доступы сотрудников к разделам админки</p>
        </div>
        <button onClick={openCreate} className="btn-gold px-4 py-2 text-sm">+ Пользователь</button>
      </div>

      {isLoading && <p className="py-8 text-center text-sub">Загрузка...</p>}

      <div className="card-dark overflow-hidden rounded-2xl">
        {(users ?? []).map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-5 py-4 last:border-0">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 font-display text-lg font-bold text-gold">
                {u.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display tracking-widest uppercase text-main">{u.name}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${u.role === 'SUPERADMIN' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-sub'}`}>
                    {u.role === 'SUPERADMIN' ? 'Суперадмин' : 'Сотрудник'}
                  </span>
                  {!u.active && <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] uppercase text-red-300">Отключён</span>}
                </div>
                <div className="text-xs text-sub">{u.email} · {u.phone}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {u.role === 'SUPERADMIN' ? (
                    <span className="text-[11px] text-gold">Все разделы</span>
                  ) : u.permissions.length === 0 ? (
                    <span className="text-[11px] text-sub">Нет доступов</span>
                  ) : (
                    u.permissions.map((p) => {
                      const s = ADMIN_SECTIONS.find((x) => x.key === p);
                      return <span key={p} className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-sub">{s?.label ?? p}</span>;
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => openEdit(u)} className="text-xs text-gold-light hover:underline">Изменить</button>
              <button onClick={() => remove(u)} className="text-xs text-red-400 hover:underline">Удалить</button>
            </div>
          </div>
        ))}
        {users && users.length === 0 && <p className="py-10 text-center text-sub">Пользователей нет</p>}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={close}>
          <div className="card-dark max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg tracking-widest uppercase text-gold">
              {modal.id ? 'Редактировать пользователя' : 'Новый пользователь'}
            </h3>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Имя</label>
                  <input className="input-dark" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label-dark">Телефон</label>
                  <input className="input-dark" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-dark">Email</label>
                <input type="email" className="input-dark" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">{modal.id ? 'Новый пароль (если меняем)' : 'Пароль'}</label>
                  <input type="password" className="input-dark" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
                </div>
                <div>
                  <label className="label-dark">Роль</label>
                  <select className="input-dark" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'SUPERADMIN' | 'STAFF' })} disabled={!callerIsSuper && form.role === 'SUPERADMIN'}>
                    <option value="STAFF">Сотрудник</option>
                    {callerIsSuper && <option value="SUPERADMIN">Суперадмин</option>}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-sub">
                <input type="checkbox" className="h-4 w-4 accent-[#d4af37]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Активен (может входить)
              </label>

              <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                <div className="mb-2 font-display text-xs tracking-widest uppercase text-gold">Доступ к разделам</div>
                {form.role === 'SUPERADMIN' ? (
                  <p className="text-sm text-sub">Суперадмин имеет доступ ко всем разделам по умолчанию.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {ADMIN_SECTIONS.map((s) => (
                      <label key={s.key} className="flex items-center gap-2 text-sm text-main">
                        <input type="checkbox" className="h-4 w-4 accent-[#d4af37]" checked={form.permissions.includes(s.key)} onChange={() => togglePerm(s.key)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {err && <p className="text-sm text-red-400">{err}</p>}
              <div className="flex gap-3">
                <button onClick={save} disabled={saving} className="btn-gold flex-1 px-5 py-3 text-sm">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button onClick={close} className="btn-ghost px-4 py-3 text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
