import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
    // Activar GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  const reject = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setVisible(false)
    // Desactivar GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#111110', borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
        Usamos cookies de análisis (Google Analytics) para mejorar el servicio. 
        Consulta nuestra{' '}
        <Link href="/privacidad" style={{ color: '#00e87a', textDecoration: 'none' }}>
          política de privacidad
        </Link>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={reject} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, fontWeight: 500,
        }}>
          Rechazar
        </button>
        <button onClick={accept} style={{
          background: '#00e87a', border: 'none',
          color: '#030303', padding: '8px 20px', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, fontWeight: 700,
        }}>
          Aceptar
        </button>
      </div>
    </div>
  )
}
