import Script from 'next/script';

export default function Analytics({ yandexId, googleId }: { yandexId?: string | null; googleId?: string | null }) {
  const yandex = (yandexId || '').trim();
  const google = (googleId || '').trim();

  return (
    <>
      {google ? (
        <>
          <Script async src={`https://www.googletagmanager.com/gtag/js?id=${google}`} strategy="afterInteractive" />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${google}');`
            }}
          />
        </>
      ) : null}

      {yandex ? (
        <>
          <Script
            id="ym-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${yandex},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`
            }}
          />
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${yandex}`}
                style={{ position: 'absolute', left: '-9999px' }}
                alt=""
              />
            </div>
          </noscript>
        </>
      ) : null}
    </>
  );
}
