'use client';

import { CheckIcon, StarIcon } from './icons';

const WE_CREATE = ['Бесплатные тренировки', 'Участие в соревнованиях', 'Путь к профессии', 'Полное обеспечение'];
const SPONSORS = ['Престиж', 'Реклама', 'PR', 'Социальная значимость'];

export default function Project() {
  return (
    <section id="project" className="relative scroll-mt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0e0e0e] to-[#1a1406]" />
      <div className="bg-pattern absolute inset-0 opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5">
              <StarIcon className="h-4 w-4 text-gold" />
              <span className="font-display text-xs tracking-widest text-gold-light uppercase">
                Социальный проект
              </span>
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
              <span className="gold-text">ПРОЕКТ «СИЛЬНАЯ МОЛОДЁЖЬ»</span>
            </h2>
            <p className="mt-5 font-display text-lg tracking-wide text-gold-light">
              Инвестируем в будущее. Создаём чемпионов!
            </p>
            <p className="mt-5 leading-relaxed text-sub">
              Мы убираем финансовый барьер и даём каждому ребёнку реальный шанс на развитие: платим за экипировку,
              организовываем бесплатные тренировки и ведём детей к спортивной профессии.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                <h4 className="font-display tracking-widest uppercase text-gold">Что мы создаём</h4>
                <ul className="mt-4 space-y-2">
                  {WE_CREATE.map((w) => (
                    <li key={w} className="flex items-center gap-2 text-sm text-main">
                      <CheckIcon className="h-4 w-4 shrink-0 text-gold" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                <h4 className="font-display tracking-widest uppercase text-gold">Что получают спонсоры</h4>
                <ul className="mt-4 space-y-2">
                  {SPONSORS.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-main">
                      <CheckIcon className="h-4 w-4 shrink-0 text-gold" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <a href="#contacts" className="btn-gold mt-8 px-8 py-4 text-base">
              Стать партнёром
            </a>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-[#16140a] to-black p-8">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10">
                <StarIcon className="h-10 w-10 text-gold" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-widest gold-text uppercase">
                Сильная молодёжь
              </h3>
              <p className="mt-2 font-display text-sm tracking-widest text-sub uppercase">ROMANOFF FIGHT CLUB</p>
            </div>
            <div className="mt-8 space-y-4">
              {WE_CREATE.map((w, i) => (
                <div key={w} className="flex items-center gap-4 rounded-lg border border-white/5 bg-black/30 px-5 py-4">
                  <span className="font-display text-2xl font-bold gold-text">0{i + 1}</span>
                  <span className="text-main">{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
