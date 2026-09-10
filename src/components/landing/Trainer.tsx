'use client';

import { COACH_NAME } from '@/lib/constants';
import { ShieldIcon, StarIcon, TrophyIcon } from './icons';

const REGALIA = [
  'Мастер спорта международного класса по рукопашному бою',
  'Мастер спорта по каратэ',
  'Чемпион Мира и Европы по самообороне',
  'Титулованный тренер (победитель международных турниров)',
  'Стаж работы — 17 лет'
];

export default function Trainer() {
  return (
    <section id="about" className="dark-section relative overflow-hidden scroll-mt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative">
          <div className="absolute -inset-4 rounded-2xl bg-gold-gradient opacity-20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e] p-8">
            <div className="bg-radial-gold absolute inset-0" />
            <div className="relative flex flex-col items-center py-4">
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-gold-gradient opacity-30 blur-xl" />
                <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 shadow-gold">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/uploads/photo.JPG"
                    alt={COACH_NAME}
                    className="h-80 w-64 object-cover sm:h-96 sm:w-72"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-black/80 px-5 py-1.5 backdrop-blur">
                  <span className="font-display text-xs tracking-widest text-gold uppercase">Основатель клуба</span>
                </div>
              </div>
              <h3 className="mt-10 font-display text-2xl font-bold tracking-widest gold-text uppercase">
                {COACH_NAME}
              </h3>
              <p className="mt-2 font-display text-sm tracking-widest text-sub uppercase">
                Основатель и главный тренер
              </p>
            </div>
          </div>
        </div>

        <div>
          <span className="font-display text-sm tracking-widest text-gold uppercase">Твой тренер</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            <span className="gold-text">СЕРГЕЙ РОМАНОВ</span>
          </h2>
          <div className="mt-4 h-0.5 w-24 bg-gold-gradient" />

          <ul className="mt-8 space-y-4">
            {REGALIA.map((r) => (
              <li key={r} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gold/10">
                  {r.includes('Стаж') ? (
                    <StarIcon className="h-5 w-5 text-gold" />
                  ) : r.includes('Мира') ? (
                    <TrophyIcon className="h-5 w-5 text-gold" />
                  ) : (
                    <ShieldIcon className="h-5 w-5 text-gold" />
                  )}
                </span>
                <span className="text-main">{r}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 rounded-lg border-l-2 border-gold bg-black/30 px-5 py-4 text-sub">
            Индивидуальный подход к каждому ученику, контроль техники и прогресса. Мы не просто учим бить — мы
            воспитываем характер и дисциплину.
          </p>
        </div>
      </div>
    </section>
  );
}
