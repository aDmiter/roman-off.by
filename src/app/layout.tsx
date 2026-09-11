import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Analytics from '@/components/Analytics';
import { prisma } from '@/lib/prisma';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/constants';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: '/uploads/favicon.ico',
    shortcut: '/uploads/favicon.ico',
    apple: '/uploads/logo.png'
  },
  keywords: [
    'бойцовский клуб Брест',
    'тренировки ММА',
    'самооборона для женщин',
    'рукопашный бой',
    'дети спорт',
    'Сергей Романов',
    'ROMANOFF FIGHT CLUB'
  ]
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') || '';
  const analytics = await prisma.analyticsSetting.findFirst().catch(() => null);
  const showAnalytics = !pathname.startsWith('/admin');

  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {showAnalytics && <Analytics yandexId={analytics?.yandexId} googleId={analytics?.googleId} />}
      </body>
    </html>
  );
}
