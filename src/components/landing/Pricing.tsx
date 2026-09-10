'use client';

import { useState } from 'react';
import { CheckIcon } from './icons';

type Plan = {
  title: string;
  amount: string;
  unit: string;
  features: string[];
  featured?: boolean;
  badge?: string;
};

const TABS: { key: string; label: string; plans: Plan[] }[] = [
  {
    key: 'group',
    label: 'Групповые',
    plans: [
      { title: '4 занятия', amount: '100', unit: 'BYN', features: ['Стандарт', 'Все группы', 'Абонемент 1 мес.'] },
      { title: '8 занятий', amount: '180', unit: 'BYN', features: ['Выгодно', 'Все группы', 'Абонемент 1 мес.'], featured: true, badge: 'Популярно' },
      { title: '12 занятий', amount: '240', unit: 'BYN', features: ['Лучшая цена', 'Все группы', 'Абонемент 1 мес.'] }
    ]
  },
  {
    key: 'personal',
    label: 'Персональные',
    plans: [
      { title: 'Разовая', amount: '70', unit: 'BYN', features: ['1 занятие', 'Индивидуально', 'Любое время'] },
      { title: 'Блок 4', amount: '260', unit: 'BYN', features: ['4 занятия', 'Индивидуально', '1 тренер'], featured: true, badge: 'Выгодно' },
      { title: 'Блок 8', amount: '480', unit: 'BYN', features: ['8 занятий', 'Индивидуально', '1 тренер'] }
    ]
  },
  {
    key: 'split',
    label: 'Сплит (вдвоём)',
    plans: [
      { title: 'Разовое', amount: '100', unit: 'BYN', features: ['за двоих', '1 занятие', 'Тренер'] },
      { title: 'Абонемент 8', amount: '720', unit: 'BYN', features: ['8 занятий', 'за двоих', 'Тренер'], featured: true, badge: 'Выгодно' },
      { title: 'Абонемент 12', amount: '1020', unit: 'BYN', features: ['12 занятий', 'за двоих', 'Тренер'] }
    ]
  },
  {
    key: 'vip',
    label: 'VIP / под ключ',
    plans: [
      {
        title: 'VIP-Пакет',
        amount: '960',
        unit: 'BYN',
        features: ['12 тренировок', 'Анализ техники', 'Онлайн-поддержка', 'Мастер-класс'],
        featured: true,
        badge: 'Ограничено'
      },
      {
        title: 'Индивидуальная программа',
        amount: '1080',
        unit: 'BYN',
        features: ['12 тренировок', 'План питания', 'Консультации', 'Персональная программа'],
        badge: 'Топ'
      }
    ]
  }
];

export default function Pricing() {
  const [active, setActive] = useState('group');
  const plans = TABS.find((t) => t.key === active)?.plans ?? [];

  return (
    <section id="prices" className="dark-section relative scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="font-display text-sm tracking-widest text-gold uppercase">Цены</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            <span className="gold-text">ВЫБЕРИ СВОЙ ФОРМАТ</span>
          </h2>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`tab-gold px-5 py-3 font-display text-sm tracking-widest uppercase transition-colors ${active === t.key ? 'active text-gold' : 'text-sub'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.title} className={`card-dark relative rounded-2xl p-8 ${p.featured ? 'border-gold/60 shadow-gold' : ''}`}>
              {p.badge && (
                <span className="absolute -top-3 right-6 rounded-full bg-gold-gradient px-4 py-1 font-display text-xs tracking-widest text-black uppercase">
                  {p.badge}
                </span>
              )}
              <h3 className="font-display text-lg font-bold tracking-widest uppercase">{p.title}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-display text-5xl font-bold gold-text">{p.amount}</span>
                <span className="mb-2 font-display text-sm tracking-widest text-sub">{p.unit}</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-white/5 pt-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-sub">
                    <CheckIcon className="h-4 w-4 shrink-0 text-gold" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#contacts" className={`${p.featured ? 'btn-gold' : 'btn-ghost'} mt-7 w-full px-5 py-3 text-sm`}>
                Выбрать
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
