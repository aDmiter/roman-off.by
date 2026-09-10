'use client';

import { FlameIcon, GlobeIcon, ShieldIcon } from './icons';

const ITEMS = [
  {
    icon: FlameIcon,
    title: 'Программы под уровень',
    desc: 'Адаптация под возраст и подготовку. Новичок не попадает «сразу в спарринг» — всё планомерно и безопасно.'
  },
  {
    icon: GlobeIcon,
    title: 'Тренеры с опытом',
    desc: 'Реальный спортивный опыт и умение учить — а не просто «бить». Передаём технику и понимание боя.'
  },
  {
    icon: ShieldIcon,
    title: 'Безопасная атмосфера',
    desc: 'Уважение, контроль нагрузки и внимание к технике. Клуб — это комьюнити, а не место для травм.'
  }
];

export default function Advantages() {
  return (
    <section className="relative bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="font-display text-sm tracking-widest text-gold uppercase">Преимущества</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            <span className="gold-text">ПОЧЕМУ ВЫБИРАЮТ НАС</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-dark group rounded-2xl p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold transition-all group-hover:shadow-gold">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-widest uppercase transition-colors group-hover:text-gold">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-sub">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
