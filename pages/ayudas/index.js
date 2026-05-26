import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const CCAAS = [
  { slug: 'cataluna', nombre: 'Cataluña' },
  { slug: 'madrid', nombre: 'Madrid' },
  { slug: 'andalucia', nombre: 'Andalucía' },
  { slug: 'comunidad-valenciana', nombre: 'Comunidad Valenciana' },
  { slug: 'pais-vasco', nombre: 'País Vasco' },
  { slug: 'galicia', nombre: 'Galicia' },
  { slug: 'aragon', nombre: 'Aragón' },
  { slug: 'castilla-y-leon', nombre: 'Castilla y León' },
  { slug: 'castilla-la-mancha', nombre: 'Castilla-La Mancha' },
  { slug: 'canarias', nombre: 'Canarias' },
  { slug: 'baleares', nombre: 'Baleares' },
  { slug: 'navarra', nombre: 'Navarra' },
  { slug: 'extremadura', nombre: 'Extremadura' },
  { slug: 'asturias', nombre: 'Asturias' },
  { slug: 'murcia', nombre: 'Murcia' },
  { slug: 'cantabria', nombre: 'Cantabria' },
  { slug: 'la-rioja', nombre: 'La Rioja' },
]

export default function AyudasIndex({ ayudas, total }) {
  return (
    <>
      <Head>
        <title>Ayudas públicas en España 2025-2026 — Subvenciones y prestaciones | Cóbratelo.es</title>
        <meta name="description" content={`Descubre las ${total}+ ayudas públicas disponibles en España: subvenciones, prestaciones, bonificaciones y becas estatales, autonómicas y locales. Comprueba si te corresponden en 2 minutos.`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.cobratelo.es/ayudas" />
      </Head>
      <div style={{ background: '#fff', minHeight: '100vh', color: '#1a0d00' }}>
        <nav style={{ background: '#321A00', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,200,120,0.12)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none' }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 100, textDecoration: 'none' }}>Ver mis ayudas</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12, color: '#1a0d00' }}>
            Ayudas públicas en España
          </h1>
          <p style={{ fontSize: 16, color: '#7a4a1a', marginBottom: 48, maxWidth: 600, lineHeight: 1.7 }}>
            {total}+ ayudas verificadas: subvenciones, prestaciones, bonificaciones y becas estatales, autonómicas y locales. Actualizadas continuamente.
          </p>

          {/* Por CCAA */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0d00', marginBottom: 20 }}>Ayudas por comunidad autónoma</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              <Link href="/ayudas/ccaa/espana" style={{ background: '#321A00', color: '#FFF5EB', padding: '14px 18px', borderRadius: 14, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'block' }}>
                🇪🇸 Todas — España
              </Link>
              {CCAAS.map(c => (
                <Link key={c.slug} href={`/ayudas/ccaa/${c.slug}`} style={{ background: '#FFFAF5', border: '1px solid #F5C89A', color: '#1a0d00', padding: '14px 18px', borderRadius: 14, textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'block' }}>
                  {c.nombre}
                </Link>
              ))}
            </div>
          </section>

          {/* Últimas ayudas */}
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0d00', marginBottom: 20 }}>Ayudas recientes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #F5C89A', borderRadius: 16, overflow: 'hidden' }}>
              {ayudas.map((a, i) => {
                const importe = a.importe_max ? `${a.importe_max.toLocaleString('es-ES')}€` : a.importe_min ? `${a.importe_min.toLocaleString('es-ES')}€+` : null
                return (
                  <Link key={a.id} href={`/ayudas/${a.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', background: i%2===0 ? '#fff' : '#FFFAF5', borderBottom: i<ayudas.length-1 ? '1px solid #FFF0E0' : 'none', textDecoration: 'none', color: '#1a0d00' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{a.nombre}</p>
                      <p style={{ fontSize: 11, color: '#7a4a1a' }}>{a.organismo}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {importe && <span style={{ fontSize: 13, fontWeight: 700, color: '#FF8300' }}>{importe}</span>}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: a.estado==='abierta' ? 'rgba(34,197,94,0.1)' : '#f5f5f5', color: a.estado==='abierta' ? '#16a34a' : '#888' }}>{a.estado==='abierta' ? 'Abierta' : 'Pendiente'}</span>
                      <span style={{ fontSize: 12, color: '#FF8300' }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* CTA */}
          <div style={{ background: '#321A00', borderRadius: 20, padding: '40px 32px', marginTop: 56, textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#FFF5EB', marginBottom: 8 }}>Descubre las ayudas que te corresponden</p>
            <p style={{ fontSize: 14, color: 'rgba(255,245,235,0.55)', marginBottom: 24 }}>Completa tu perfil en 2 minutos y te mostramos exactamente qué puedes cobrar tú.</p>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>Empezar gratis →</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticProps() {
  const { data, count } = await supabase.from('ayudas').select('id,nombre,slug,organismo,tipo,estado,importe_min,importe_max,comunidad_autonoma', { count: 'exact' }).not('slug','is',null).order('created_at', { ascending: false }).limit(30)
  return { props: { ayudas: data||[], total: count||0 }, revalidate: 3600 }
}
