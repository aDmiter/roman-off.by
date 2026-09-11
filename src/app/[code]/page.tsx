import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { barcodePngDataUrl } from '@/lib/barcode';
import { formatDateRu } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Абонемент — ROMANOFF FIGHT CLUB',
  robots: { index: false, follow: false }
};

function statusText(status: string, expiredByDate: boolean): string {
  if (expiredByDate) return 'Просрочен';
  if (status === 'USED_UP') return 'Использован';
  if (status === 'EXPIRED') return 'Просрочен';
  return 'Активен';
}

export default async function PublicMembershipPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code || '').toUpperCase();
  if (!/^RFC-\d{1,}$/.test(code)) notFound();

  const membership = await prisma.membership.findUnique({ where: { code } });
  if (!membership) notFound();

  const barcode = await barcodePngDataUrl(membership.code);
  const remaining = Math.max(0, membership.totalSessions - membership.usedSessions);
  const expiredByDate = !!membership.expiresAt && membership.expiresAt < new Date();
  const active = membership.status === 'ACTIVE' && remaining > 0 && !expiredByDate;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="card-dark overflow-hidden rounded-3xl p-6">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uploads/logo.png" alt="ROMANOFF" className="mx-auto h-16 w-16 object-contain" />
            <div className="mt-3 font-display text-xl font-bold tracking-widest gold-text uppercase">ROMANOFF</div>
            <div className="font-display text-[10px] tracking-[0.3em] text-sub uppercase">Fight Club · Абонемент</div>
          </div>

          <div className={`mt-6 rounded-2xl border p-4 text-center ${active ? 'border-gold/40 bg-gold/5' : 'border-red-500/30 bg-red-500/10'}`}>
            <div className="text-xs uppercase tracking-widest text-sub">Осталось занятий</div>
            <div className={`font-display text-5xl font-bold ${active ? 'gold-text' : 'text-red-300'}`}>{remaining}</div>
            <div className="text-xs text-sub">из {membership.totalSessions}</div>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-sub">Владелец</span>
              <span className="text-right text-main">{membership.holderName}</span>
            </div>
            {membership.typeName && (
              <div className="flex justify-between gap-3">
                <span className="text-sub">Вид</span>
                <span className="text-right text-main">{membership.typeName}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-sub">Телефон</span>
              <span className="text-right text-main">{membership.phone}</span>
            </div>
            {membership.expiresAt && (
              <div className="flex justify-between gap-3">
                <span className="text-sub">Действует до</span>
                <span className="text-right text-main">{formatDateRu(membership.expiresAt)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-sub">Статус</span>
              <span className={`text-right font-display tracking-widest uppercase ${active ? 'text-gold' : 'text-red-300'}`}>
                {statusText(membership.status, expiredByDate)}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcode} alt={membership.code} className="w-full" />
          </div>
          <div className="mt-2 text-center font-mono text-sm text-sub">{membership.code}</div>

          <p className="mt-5 text-center text-xs text-sub">Покажите штрихкод администратору клуба при посещении</p>
        </div>
        <p className="mt-4 text-center font-display text-xs tracking-widest text-sub uppercase">
          Дисциплина. Характер. Победа.
        </p>
      </div>
    </div>
  );
}
