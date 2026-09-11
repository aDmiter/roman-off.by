'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { postJSON } from '@/lib/api';

type Scanned = {
  membership: {
    id: number;
    code: string;
    holderName: string;
    phone: string;
    totalSessions: number;
    usedSessions: number;
    remaining: number;
    status: string;
    barcode: string;
  };
};

const CODE_PREFIX = 'RFC-';

// Маска ручного ввода: всегда префикс RFC- и до 10 цифр.
function maskCode(raw: string): string {
  const upper = raw.toUpperCase();
  const body = upper.replace(/^RFC-?/, '').replace(/\D/g, '').slice(0, 10);
  return CODE_PREFIX + body;
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('RFC-');
  const [result, setResult] = useState<Scanned | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedNote, setUsedNote] = useState<string | null>(null);
  const [flash, setFlash] = useState<'ok' | 'err'>('ok');
  const lastRef = useRef<string>('');
  const busyRef = useRef(false);
  const [canTorch, setCanTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const start = async () => {
    setCameraError(null);
    setResult(null);
    setUsedNote(null);
    setLookupError(null);
    lastRef.current = '';
    try {
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const controls = await reader.decodeFromConstraints(constraints, videoRef.current!, (r) => {
        if (!r) return;
        const text = r.getText();
        if (text && text !== lastRef.current) {
          lastRef.current = text;
          try {
            navigator.vibrate?.(80);
          } catch {}
          handleCode(text);
        }
      });
      controlsRef.current = controls;
      setScanning(true);
      tuneTrack();
    } catch (e: any) {
      setCameraError('Нет доступа к камере. Разрешите доступ или введите код вручную.');
      setScanning(false);
    }
  };

  const tuneTrack = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      if (!track) return;
      const caps: any = (track as any).getCapabilities?.() || {};
      if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
      }
      setCanTorch(Array.isArray(caps.torch) && caps.torch.includes(true));
    } catch {}
  };

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {}
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
    setTorchOn(false);
    lastRef.current = '';
  };

  const handleCode = async (raw: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setLookupError(null);
    setUsedNote(null);
    setFlash('ok');
    try {
      const res = await postJSON<Scanned>('/api/memberships/scan', { code: raw });
      setResult(res);
      setFlash('ok');
      setTimeout(() => setFlash('ok'), 600);
    } catch (e: any) {
      setResult(null);
      setLookupError(e.message || 'Абонемент не найден');
      setFlash('err');
      lastRef.current = '';
      setTimeout(() => setFlash('err'), 600);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const deduct = async (id: number) => {
    if (!confirm('Списать одно занятие с данного абонемента?')) return;
    setBusy(true);
    try {
      await postJSON(`/api/memberships/${id}/use`, {});
      setUsedNote('Занятие списано');
      await handleCode(result?.membership.code ?? '');
    } catch (e: any) {
      setUsedNote(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length <= CODE_PREFIX.length) return;
    handleCode(manualCode);
    setManualCode(CODE_PREFIX);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);

  const m = result?.membership;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">Сканировать абонемент</h1>
          <p className="mt-1 text-sm text-sub">Наведите камеру на штрихкод, затем спишите занятие</p>
        </div>
        {scanning ? (
          <div className="flex items-center gap-2">
            {canTorch && (
              <button onClick={toggleTorch} className={`btn-ghost px-4 py-2.5 text-sm ${torchOn ? 'ring-1 ring-gold' : ''}`}>
                {torchOn ? 'Фонарик вкл' : 'Фонарик'}
              </button>
            )}
            <button onClick={stop} className="btn-ghost px-5 py-2.5 text-sm">Остановить камеру</button>
          </div>
        ) : (
          <button onClick={start} className="btn-gold px-5 py-2.5 text-sm">Включить сканер</button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-2xl border-2 bg-black ${flash === 'ok' ? 'border-gold/60' : 'border-red-500/70'} ${busy ? 'opacity-60' : ''}`}
          >
            <div className="relative">
              <video ref={videoRef} className="scanner-video" muted playsInline autoPlay />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center">
                  <div className="font-display text-lg tracking-widest text-gold uppercase">Сканер готов</div>
                  <p className="mt-2 max-w-xs px-4 text-sm text-sub">
                    Нажмите «Включить сканер» и наведите камеру на штрихкод — сработает автоматически
                  </p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-x-0 top-0 bg-red-500/90 p-3 text-center text-sm">{cameraError}</div>
              )}
              {scanning && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="h-40 w-[85%] rounded-lg border-2 border-gold/70" />
                  <span className="rounded bg-black/60 px-3 py-1 font-display text-xs tracking-widest text-gold uppercase">
                    {busy ? 'Проверяем…' : 'Ищу штрихкод…'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={onSubmitManual} className="card-dark flex items-center gap-3 rounded-2xl p-4">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(maskCode(e.target.value))}
              placeholder="RFC-0000000000"
              inputMode="numeric"
              className="input-dark flex-1 font-mono tracking-widest"
            />
            <button type="submit" className="btn-ghost px-5 py-2.5 text-sm">Найти</button>
          </form>
          <p className="text-xs text-sub">Формат абонемента: RFC- и 10 цифр. Можно вводить цифры вручную или сканировать USB-сканером.</p>
          {lookupError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{lookupError}</p>}
        </div>

        <div>
          {m ? (
            <div className="card-dark rounded-2xl border-2 border-gold/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-xl tracking-widest uppercase">{m.holderName}</div>
                  <div className="text-sm text-sub">{m.phone}</div>
                </div>
                <span className={`rounded px-3 py-1 font-display text-sm ${m.remaining > 0 ? 'bg-gold/15 text-gold' : 'bg-red-500/15 text-red-300'}`}>
                  {m.status === 'ACTIVE' ? 'Активен' : m.status === 'USED_UP' ? 'Использован' : 'Просрочен'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-white/5 bg-black/30 py-3">
                  <div className="font-display text-2xl font-bold text-main">{m.totalSessions}</div>
                  <div className="text-xs text-sub">Всего</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/30 py-3">
                  <div className="font-display text-2xl font-bold text-red-300">{m.usedSessions}</div>
                  <div className="text-xs text-sub">Использовано</div>
                </div>
                <div className="rounded-lg border border-gold/40 bg-gold/10 py-3">
                  <div className="font-display text-2xl font-bold gold-text">{m.remaining}</div>
                  <div className="text-xs text-sub">Осталось</div>
                </div>
              </div>

              <img src={m.barcode} alt="Barcode" className="mt-5 w-full rounded bg-white p-2" />
              <div className="mt-2 text-center font-mono text-sm text-sub">{m.code}</div>

              {m.remaining > 0 && m.status === 'ACTIVE' ? (
                <button onClick={() => deduct(m.id)} disabled={busy} className="btn-gold mt-5 w-full px-6 py-4 text-base">
                  {busy ? 'Обработка...' : 'Списать одно занятие'}
                </button>
              ) : (
                <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
                  Занятия на этом абонементе закончились
                </div>
              )}
              {usedNote && <p className="mt-3 text-center text-sm text-green-400">{usedNote}</p>}
            </div>
          ) : (
            <div className="card-dark flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl p-8 text-center text-sub">
              <div className="text-5xl">▤</div>
              <p className="mt-4">Отсканируйте абонемент, чтобы увидеть информацию и списать занятие</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
