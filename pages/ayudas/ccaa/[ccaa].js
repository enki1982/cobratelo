import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

const CCAA_MAP = {
  'cataluna': 'Cataluña', 'madrid': 'Madrid', 'andalucia': 'Andalucía',
  'comunidad-valenciana': 'Comunidad Valenciana', 'pais-vasco': 'País Vasco',
  'galicia': 'Galicia', 'aragon': 'Aragón', 'castilla-y-leon': 'Castilla y León',
  'castilla-la-mancha': 'Castilla-La Mancha', 'canarias': 'Canarias',
  'baleares': 'Baleares', 'navarra': 'Navarra', 'extremadura': 'Extremadura',
  'asturias': 'Asturias', 'murcia': 'Murcia', 'cantabria': 'Cantabria',
  'la-rioja': 'La Rioja', 'espana': null,
}

export default function CcaaPage({ ayudas, ccaa, ccaaSlug, total }) {
  const titulo = ccaa ? `Ayudas en ${ccaa}` : 'Ayudas estatales España'
  const title = `${titulo} 2025-2026 — Subvenciones y prestaciones | Cóbratelo.es`
  const desc = `${total} ayudas públicas ${ccaa ? `en ${ccaa}` : 'en España'}: subvenciones, prestaciones y bonificaciones. Comprueba cuáles te corresponden en 2 minutos.`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.cobratelo.es/ayudas/ccaa/${ccaaSlug}`} />
      </Head>
      <div style={{ background: '#fff', minHeight: '100vh', color: '#1a0d00' }}>
        <nav style={{ background: '#321A00', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,200,120,0.12)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none' }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 100, textDecoration: 'none' }}>Ver mis ayudas</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
          <p style={{ fontSize: 12, color: '#7a4a1a', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#7a4a1a', textDecoration: 'none' }}>Inicio</Link> › <Link href="/ayudas" style={{ color: '#7a4a1a', textDecoration: 'none' }}>Ayudas</Link> › {ccaa || 'España'}
          </p>

          <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>
            {titulo}
          </h1>
          <p style={{ fontSize: 16, color: '#7a4a1a', marginBottom: 40, lineHeight: 1.7 }}>
            {total} ayudas verificadas {ccaa ? `en ${ccaa}` : 'a nivel estatal en España'}. Subvenciones, prestaciones, bonificaciones y becas.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #F5C89A', borderRadius: 16, overflow: 'hidden', marginBottom: 48 }}>
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

          <div style={{ background: '#321A00', borderRadius: 20, padding: '36px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#FFF5EB', marginBottom: 8 }}>¿Cuáles te corresponden a ti?</p>
            <p style={{ fontSize: 14, color: 'rgba(255,245,235,0.55)', marginBottom: 20 }}>Responde 10 preguntas y te mostramos exactamente qué ayudas puedes cobrar.</p>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>Empezar gratis →</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  return { paths: Object.keys(CCAA_MAP).map(slug => ({ params: { ccaa: slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const ccaaSlug = params.ccaa
  const ccaa = CCAA_MAP[ccaaSlug] || null
  let query = supabase.from('ayudas').select('id,nombre,slug,organismo,tipo,estado,importe_min,importe_max', { count: 'exact' }).not('slug','is',null).order('estado', { ascending: false }).limit(50)
  if (ccaa) query = query.eq('comunidad_autonoma', ccaa)
  else query = query.eq('ambito', 'estatal')
  const { data, count } = await query
  return { props: { ayudas: data||[], ccaa, ccaaSlug, total: count||0 }, revalidate: 3600 }
}
