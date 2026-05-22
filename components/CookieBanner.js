import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C } from '../lib/theme'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cobratelo_cookies')
    if (!consent) setVisible(true)
  }, [])

  const aceptar = () => { localStorage.setItem('cobratelo_cookies', 'accepted'); setVisible(false) }
  const rechazar = () => { localStorage.setItem('cobratelo_cookies', 'rejected'); setVisible(false) }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'calc(100% - 48px)', maxWidth: 600 }}>
      <div style={{ background: 'rgba(15,15,26,0.97)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 22px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 3 }}>Usamos cookies</p>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Solo cookies esenciales.{' '}
            <Link href="/cookies" style={{ color: C.green, textDecoration: 'none' }}>Más información</Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={rechazar} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 100, cursor: 'pointer' }}>
            Rechazar
          </button>
          <button onClick={aceptar} style={{ background: C.green, border: 'none', color: '#000', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 100, cursor: 'pointer' }}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
