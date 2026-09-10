'use client';

import { useEffect, useRef } from 'react';
import { CheckIcon, StarIcon } from './icons';

const HIGHLIGHTS = ['Мастер спорта', 'Чемпион Мира', 'Стаж 17 лет'];

function FighterSilhouette() {
  return (
    <svg viewBox="0 0 400 520" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="fgold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d97a" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#7a5a06" />
        </linearGradient>
        <radialGradient id="fglow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="250" rx="180" ry="220" fill="url(#fglow)" opacity="0.7" />
      <circle cx="200" cy="120" r="42" fill="url(#fgold)" opacity="0.95" />
      <path d="M155 175 Q200 160 245 175 L260 320 Q200 350 140 320 Z" fill="url(#fgold)" opacity="0.88" />
      <path d="M245 200 Q320 200 300 160 Q280 120 250 150 Z" fill="url(#fgold)" opacity="0.8" />
      <path d="M155 200 Q80 200 100 160 Q120 120 150 150 Z" fill="url(#fgold)" opacity="0.8" />
      <path d="M150 300 Q200 330 250 300 L245 360 L155 360 Z" fill="url(#fgold)" opacity="0.75" />
      <path d="M158 360 L130 500 L165 500 L180 390 L210 390 L225 500 L262 500 L242 360 Z" fill="url(#fgold)" opacity="0.7" />
      <path d="M120 150 Q90 90 130 60 Q170 40 190 90 Q170 120 140 150 Z" fill="url(#fgold)" opacity="0.55" />
      <path d="M280 150 Q310 90 270 60 Q230 40 210 90 Q230 120 260 150 Z" fill="url(#fgold)" opacity="0.55" />
    </svg>
  );
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 600) el.style.transform = `translateY(${y * 0.18}px)`;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="top" className="hero-figure relative overflow-hidden bg-bg">
      <div className="bg-pattern absolute inset-0 opacity-40" />
      <div className="bg-radial-gold absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-32 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-40 lg:pb-28">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-gold pulse-gold" />
            <span className="font-display text-xs tracking-widest text-gold-light uppercase">
              Бойцовский клуб · Брест
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="gold-text">ВХОДИ КАК ГОСТЬ</span>
            <br />
            <span className="text-main">ВЫХОДИ КАК</span> <span className="gold-text">ЧЕМПИОН</span>
          </h1>

          <div className="reveal-line mt-5 h-0.5 w-48 bg-gold-gradient" />

          <p className="mt-5 font-display text-xl tracking-widest text-sub">
            ROMANOFF FIGHT CLUB — дисциплина. Характер. Победа.
          </p>

          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sub">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
                  <CheckIcon className="h-3.5 w-3.5 text-gold" />
                </span>
                <span className="font-display tracking-widest uppercase">{h}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#contacts" className="btn-gold px-8 py-4 text-base">
              Начать тренировки
            </a>
            <a href="#schedule" className="btn-ghost px-8 py-4 text-base">
              Расписание
            </a>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div ref={ref} className="pointer-events-none absolute inset-0 z-0">
            <FighterSilhouette />
          </div>

          <div className="animate-float relative z-10 w-full max-w-sm">
            <div className="card-dark rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-display text-xs tracking-widest text-sub uppercase">Регалии</span>
                <div className="flex gap-1 text-gold">
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-5 text-center">
                <div className="font-display text-6xl font-bold gold-text">17</div>
                <div className="font-display text-xs tracking-widest text-gold-light uppercase">лет</div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-white/5 bg-black/30 px-4 py-3 text-sm text-main">
                  Мастер спорта международного класса
                </div>
                <div className="rounded-lg border border-white/5 bg-black/30 px-4 py-3 text-sm text-main">
                  Чемпион Мира по самообороне
                </div>
                <div className="rounded-lg border border-white/5 bg-black/30 px-4 py-3 text-sm text-main">
                  Чемпион Европы
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
