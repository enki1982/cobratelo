import Head from 'next/head'
import Link from 'next/link'

export default function ServerError() {
  return (
    <>
      <Head><title>Error del servidor — Cóbratelo.es</title></Head>
      <div style={{ background: '#030303', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f0f0f5', textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontSize: 80, fontWeight: 900, color: '#FF8300', lineHeight: 1, marginBottom: 0 }}>500</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '16px 0 8px' }}>Error del servidor</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 40, maxWidth: 360, lineHeight: 1.6 }}>
          Algo ha fallado en nuestro lado. Lo estamos arreglando. Inténtalo de nuevo en unos minutos.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{ background: '#FF8300', color: '#030303', padding: '14px 28px', borderRadius: 50, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Volver al inicio
          </Link>
          <a href="mailto:hola@cobratelo.es" style={{ background: 'rgba(255,255,255,0.08)', color: '#f0f0f5', padding: '14px 28px', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            Contactar soporte
          </a>
        </div>
      </div>
    </>
  )
}
