import CookieBanner from '../components/CookieBanner'
import '../styles/globals.css'
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function App({ Component, pageProps }) {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              // Consent mode: denegado por defecto
              gtag('consent', 'default', {
                analytics_storage: localStorage.getItem('cookie_consent') === 'accepted' ? 'granted' : 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                allow_google_signals: false,
              });

              // Eventos clave del embudo
              window.cobratelo_track = function(event, params) {
                if (typeof gtag !== 'undefined') {
                  gtag('event', event, params || {});
                }
              };
            `}
          </Script>
        </>
      )}
      <Component {...pageProps} />
      {process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}&libraries=places&language=es`}
          strategy="lazyOnload"
        />
      )}
      <CookieBanner />
    </>
  )
}
