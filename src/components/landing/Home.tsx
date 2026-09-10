'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import Hero from './Hero';
import Trainer from './Trainer';
import Directions from './Directions';
import Schedule from './Schedule';
import Advantages from './Advantages';
import Pricing from './Pricing';
import Project from './Project';
import Contacts from './Contacts';
import Footer from './Footer';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/logo.png" alt="ROMANOFF FIGHT CLUB" className="h-28 w-28 object-contain" />
          <div className="mt-6 h-0.5 w-40 overflow-hidden rounded bg-white/10">
            <div className="loader-bar h-full w-full bg-gold-gradient" />
          </div>
        </div>
      )}
      <Header />
      <main>
        <Hero />
        <Trainer />
        <Directions />
        <Schedule />
        <Advantages />
        <Pricing />
        <Project />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
