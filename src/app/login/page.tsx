'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await postJSON('/api/auth/login', { email, password });
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-bg">
      <div className="bg-radial-gold absolute inset-0" />
      <div className="bg-pattern absolute inset-0 opacity-30" />
      <form onSubmit={submit} className="card-dark relative z-10 w-full max-w-sm rounded-2xl p-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/logo.png" alt="ROMANOFF FIGHT CLUB" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <div className="font-display text-2xl font-bold tracking-widest gold-text uppercase">ROMANOFF</div>
          <div className="font-display text-sm tracking-[0.4em] text-sub uppercase">Админ-панель</div>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label-dark">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@club.by"
              className="input-dark"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="label-dark">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-dark"
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold mt-6 w-full px-6 py-3">
          {loading ? 'Проверяем...' : 'Войти'}
        </button>
        <a href="/" className="mt-4 block text-center text-sm text-gold-light hover:underline">
          ← На главную
        </a>
      </form>
    </div>
  );
}
