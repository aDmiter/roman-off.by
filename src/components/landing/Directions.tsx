'use client';

import { BullIcon, ChildIcon, DiamondIcon, UserIcon } from './icons';

const DIRECTIONS = [
  {
    title: 'Дети (8+)',
    icon: ChildIcon,
    desc: 'Игровые элементы, база движений, дисциплина',
    points: ['Базовые движения', 'Дисциплина', 'Уверенность']
  },
  {
    title: 'Подростки',
    icon: UserIcon,
    desc: 'Выносливость, реакция, уверенность',
    points: ['Выносливость', 'Реакция', 'Команда']
  },
  {
    title: 'Взрослые',
    icon: BullIcon,
    desc: 'Самооборона, стресс, сила, выносливость',
    points: ['Самооборона', 'Сила', 'Стресс']
  },
  {
    title: 'Опытные',
    icon: DiamondIcon,
    desc: 'Спарринги, нюансы техники, подготовка к соревнованиям',
    points: ['Спарринги', 'Техника', 'Соревнования']
  }
];

export default function Directions() {
  return (
    <section id="trainings" className="relative scroll-mt-16 bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="font-display text-sm tracking-widest text-gold uppercase">Направления</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            <span className="gold-text">НАПРАВЛЕНИЯ ПОДГОТОВКИ</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTIONS.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.title} className="card-dark group rounded-2xl p-7">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-widest uppercase group-hover:text-gold transition-colors">
                  {d.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sub">{d.desc}</p>
                <ul className="mt-5 space-y-2 border-t border-white/5 pt-4">
                  {d.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-main">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
