'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';

type Training = {
  id: number;
  title: string;
  groupName: string;
  category: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  coach: string;
  capacity: number;
};

const DAY_ABBR: Record<number, string> = {
  1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ', 7: 'ВС'
};

const FALLBACK: Training[] = [
  { id: 1, title: 'Группа 1', groupName: 'Дети 8-12', category: 'ДЕТИ', dayOfWeek: 1, startTime: '08:30', endTime: '09:30', coach: 'Сергей Романов', capacity: 20 },
  { id: 2, title: 'Группа 2', groupName: 'Дети 8-12', category: 'ДЕТИ', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', coach: 'Сергей Романов', capacity: 20 },
  { id: 3, title: '30+', groupName: 'Взрослые', category: 'ВЗРОСЛЫЕ', dayOfWeek: 1, startTime: '19:00', endTime: '20:00', coach: 'Сергей Романов', capacity: 20 },
  { id: 4, title: 'Старшая', groupName: 'Взрослые', category: 'ВЗРОСЛЫЕ', dayOfWeek: 1, startTime: '20:00', endTime: '21:20', coach: 'Сергей Романов', capacity: 20 },
  { id: 5, title: 'С нуля', groupName: 'Женская', category: 'ЖЕНСКАЯ', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', coach: 'Сергей Романов', capacity: 16 }
];

export default function Schedule() {
  const { data } = useSWR<Training[]>('/api/trainings', fetcher, {
    fallbackData: FALLBACK,
    revalidateOnFocus: false
  });

  const items = data && data.length > 0 ? data : FALLBACK;

  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((t) => t.category.toUpperCase() === cat)
  })).filter((g) => g.items.length > 0);

  return (
    <section id="schedule" className="dark-section relative scroll-mt-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="font-display text-sm tracking-widest text-gold uppercase">Ближайшие группы</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            <span className="gold-text">РАСПИСАНИЕ ТРЕНИРОВОК</span>
          </h2>
          <p className="mt-4 text-sub">Актуальное расписание обновляется администратором клуба</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {byCategory.map((group) => (
            <div key={group.category} className="card-dark overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/10 to-transparent px-6 py-4">
                <h3 className="font-display text-lg font-bold tracking-widest uppercase text-gold-light">
                  {group.category}
                </h3>
                <span className="font-display text-xs text-sub">{group.items.length} гр.</span>
              </div>
              <div className="divide-y divide-white/5">
                {group.items.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <div className="font-display tracking-widest uppercase text-main">{t.groupName}</div>
                      <div className="mt-1 text-xs text-sub">{t.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-display text-sm tracking-widest text-gold">
                        <span>{DAY_ABBR[t.dayOfWeek]}</span>
                        <span className="text-sub">/</span>
                        <span>{t.startTime}–{t.endTime}</span>
                      </div>
                      <div className="mt-1 text-xs text-sub">{t.coach}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-sub">
          Смотрите живые слоты на запись у администратора или оставьте заявку в блоке контактов.
        </p>
      </div>
    </section>
  );
}
