import Head from 'next/head'
import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <Head><title>Página no encontrada — Cóbratelo.es</title></Head>
      <div style={{ background: '#030303', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f0f0f5', textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontSize: 80, fontWeight: 900, color: '#00e87a', lineHeight: 1, marginBottom: 0 }}>404</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '16px 0 8px' }}>Página no encontrada</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 40, maxWidth: 360, lineHeight: 1.6 }}>
          Esta página no existe o ha sido movida. Pero seguro que hay ayudas esperándote.
        </p>
        <Link href="/" style={{ background: '#00e87a', color: '#030303', padding: '14px 28px', borderRadius: 50, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          Volver al inicio
        </Link>
      </div>
    </>
  )
}
