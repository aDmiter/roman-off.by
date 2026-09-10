'use client';

import { useEffect, useState } from 'react';
import { CLUB_PHONE, CLUB_PHONE_RAW } from '@/lib/constants';
import { CloseIcon, MenuIcon, PhoneIcon } from './icons';

const NAV = [
  { href: '#about', label: 'О клубе' },
  { href: '#trainings', label: 'Тренировки' },
  { href: '#schedule', label: 'Расписание' },
  { href: '#prices', label: 'Цены' },
  { href: '#project', label: 'Проект' },
  { href: '#contacts', label: 'Контакты' }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-md border-b border-[#d4af37]/20' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/logo.png" alt="ROMANOFF FIGHT CLUB" className="h-10 w-10 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-widest gold-text">ROMANOFF</span>
            <span className="hidden font-display text-xs tracking-[0.3em] text-sub sm:inline">FIGHT CLUB</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-display text-sm tracking-widest text-sub uppercase transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${CLUB_PHONE_RAW}`}
            className="hidden items-center gap-2 font-display text-sm tracking-widest text-gold-light md:flex"
          >
            <PhoneIcon className="h-4 w-4" />
            {CLUB_PHONE}
          </a>
          <a href="#contacts" className="btn-gold hidden px-5 py-2.5 text-sm md:inline-flex">
            Записаться
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="text-gold lg:hidden"
            aria-label="Меню"
          >
            {open ? <CloseIcon className="h-7 w-7" /> : <MenuIcon className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#d4af37]/15 bg-black/95 backdrop-blur-lg lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/5 py-3 font-display text-sm tracking-widest text-sub uppercase transition-colors hover:text-gold"
              >
                {item.label}
              </a>
            ))}
            <a href="#contacts" onClick={() => setOpen(false)} className="btn-gold mt-4 px-5 py-3 text-sm">
              Записаться на тренировку
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
