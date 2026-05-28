import CookieBanner from '../components/CookieBanner'
import '../styles/globals.css'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const SESSION_KEY = 'cbrt_session_token'
const CHECK_INTERVAL = 60 * 1000 // cada 60 segundos

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    let interval = null

    const registrarSesion = async (accessToken) => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.session_token) {
          localStorage.setItem(SESSION_KEY, json.session_token)
        }
      } catch {}
    }

    const verificarSesion = async (accessToken) => {
      try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (!stored) return // primera vez, sin verificar
        const res = await fetch(`/api/session?token=${stored}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.skip) return // ciudadano, sin restricción
        if (json.valid === false) {
          // Sesión inválida — otro dispositivo inició sesión
          localStorage.removeItem(SESSION_KEY)
          await supabase.auth.signOut()
          router.push('/login?session_expired=1')
        }
      } catch {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        await registrarSesion(session.access_token)
        // Verificar periódicamente
        interval = setInterval(() => verificarSesion(session.access_token), CHECK_INTERVAL)
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_KEY)
        if (interval) clearInterval(interval)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (interval) clearInterval(interval)
    }
  }, [])

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
