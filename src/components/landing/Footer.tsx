'use client';

import { InstagramIcon, TelegramIcon, ViberIcon } from './icons';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <div className="font-display text-xl font-bold tracking-widest gold-text uppercase">
            ROMANOFF FIGHT CLUB © 2026
          </div>
          <div className="mt-1 font-display text-xs tracking-widest text-sub uppercase">
            Дисциплина. Характер. Победа.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
            <TelegramIcon className="h-5 w-5" />
          </a>
          <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-sub transition-colors hover:border-gold hover:text-gold">
            <ViberIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
