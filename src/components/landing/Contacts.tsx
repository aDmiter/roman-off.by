'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CLUB_ADDRESS, CLUB_CITY, CLUB_PHONE, CLUB_PHONE_RAW } from '@/lib/constants';
import { postJSON } from '@/lib/api';
import { InstagramIcon, LocationIcon, PhoneIcon, TelegramIcon, ViberIcon } from './icons';

const schema = z.object({
  name: z.string().min(2, 'Укажите имя'),
  age: z.string().min(1, 'Укажите возраст'),
  goal: z.string().min(2, 'Укажите цель'),
  time: z.string().min(2, 'Укажите удобное время')
});

type FormData = z.infer<typeof schema>;

export default function Contacts() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || el.querySelector('script')) return;
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.charset = 'utf-8';
    s.async = true;
    s.src =
      'https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A0529904b671e1747d9f4e38ea6a406f24f48888ef896094c109b9bca9ae92c90&width=100%25&height=400&lang=ru_RU&scroll=true';
    el.appendChild(s);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await postJSON('/api/bookings', data);
      setSent(true);
      setLoading(false);
    } catch (e: any) {
      setError(e.message || 'Ошибка отправки');
      setLoading(false);
    }
  };

  return (
    <section id="contacts" className="relative scroll-mt-16 bg-bg">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:px-8">
        <div className="flex flex-col">
          <span className="font-display text-sm tracking-widest text-gold uppercase">Запись</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            <span className="gold-text">ХОТИТЕ ЗАПИСАТЬСЯ?</span>
          </h2>
          <p className="mt-4 text-sub">Оставьте заявку — мы подберём подходящую группу или формат и свяжемся с вами.</p>

          {sent ? (
            <div className="mt-8 rounded-xl border border-gold/50 bg-gold/10 p-8 text-center">
              <div className="font-display text-2xl font-bold gold-text uppercase">Заявка отправлена</div>
              <p className="mt-3 text-sub">Мы получили вашу заявку и скоро свяжемся с вами.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <label className="label-dark">Ваше имя</label>
                <input className="input-dark" placeholder="Как вас зовут?" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Возраст</label>
                  <input className="input-dark" placeholder="Например: 23" {...register('age')} />
                  {errors.age && <p className="mt-1 text-xs text-red-400">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="label-dark">Удобное время</label>
                  <input className="input-dark" placeholder="Например: 19:00" {...register('time')} />
                  {errors.time && <p className="mt-1 text-xs text-red-400">{errors.time.message}</p>}
                </div>
              </div>
              <div>
                <label className="label-dark">Цель тренировок</label>
                <input className="input-dark" placeholder="Самооборона / ММА / форма" {...register('goal')} />
                {errors.goal && <p className="mt-1 text-xs text-red-400">{errors.goal.message}</p>}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full px-6 py-4 text-base">
                {loading ? 'Отправляем...' : 'Отправить заявку'}
              </button>
              <p className="text-center text-xs text-sub">Мы подберём подходящую группу или формат</p>
            </form>
          )}
        </div>

        <div className="card-dark flex h-full flex-col rounded-2xl p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold">
                <LocationIcon className="h-6 w-6" />
              </span>
              <div>
                <div className="font-display text-xl font-bold tracking-wide text-main">{CLUB_ADDRESS}</div>
                <div className="mt-1 text-sub">4-й этаж</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold">
                <PhoneIcon className="h-6 w-6" />
              </span>
              <div>
                <a href={`tel:${CLUB_PHONE_RAW}`} className="font-display text-xl tracking-wide text-gold-light">
                  {CLUB_PHONE}
                </a>
                <div className="mt-1 text-sub">Ежедневно с 08:00 до 22:00</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
                <TelegramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
                <ViberIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
            <div ref={mapRef} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
