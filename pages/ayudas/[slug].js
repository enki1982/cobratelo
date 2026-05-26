import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const TIPO_LABEL = {
  subvencion:'Subvención', deduccion:'Deducción fiscal', prestacion:'Prestación',
  bonificacion:'Bonificación', beca:'Beca', credito:'Crédito bonificado',
  exencion:'Exención', tarifa:'Tarifa reducida', subsidio:'Subsidio',
}

function slugCCAA(ccaa) {
  return (ccaa||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
}

export default function AyudaPage({ ayuda }) {
  if (!ayuda) return null
  const importe = ayuda.importe_max ? `Hasta ${ayuda.importe_max.toLocaleString('es-ES')}€` : ayuda.importe_min ? `Desde ${ayuda.importe_min.toLocaleString('es-ES')}€` : ayuda.importe_descripcion || null
  const title = `${ayuda.nombre} — Cómo solicitarla y requisitos | Cóbratelo.es`
  const desc = `${ayuda.descripcion?.slice(0,150) || ayuda.nombre}. ${importe ? importe+'. ' : ''}Organismo: ${ayuda.organismo}. Descubre si cumples los requisitos.`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.cobratelo.es/ayudas/${ayuda.slug}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "GovernmentService",
              "name": ayuda.nombre,
              "description": ayuda.descripcion || ayuda.nombre,
              "provider": { "@type": "GovernmentOrganization", "name": ayuda.organismo },
              "areaServed": { "@type": "Country", "name": "Spain" },
              "url": ayuda.url_oficial || `https://www.cobratelo.es/ayudas/${ayuda.slug}`,
              ...(importe ? { "offers": { "@type": "Offer", "description": importe, "priceCurrency": "EUR" } } : {}),
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.cobratelo.es" },
                { "@type": "ListItem", "position": 2, "name": "Ayudas", "item": "https://www.cobratelo.es/ayudas" },
                { "@type": "ListItem", "position": 3, "name": ayuda.nombre, "item": `https://www.cobratelo.es/ayudas/${ayuda.slug}` },
              ]
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": `¿Quién puede solicitar ${ayuda.nombre}?`, "acceptedAnswer": { "@type": "Answer", "text": ayuda.requisitos || `Consulta los requisitos oficiales en la convocatoria de ${ayuda.organismo}.` } },
                { "@type": "Question", "name": `¿Cuánto se puede cobrar con ${ayuda.nombre}?`, "acceptedAnswer": { "@type": "Answer", "text": importe ? `${importe} según la convocatoria de ${ayuda.organismo}.` : `Consulta el importe exacto en la convocatoria oficial de ${ayuda.organismo}.` } },
              ]
            }
          ]
        })}} />
      </Head>
      <div style={{ background: '#fff', minHeight: '100vh', color: '#1a0d00' }}>
        <nav style={{ background: '#321A00', borderBottom: '1px solid rgba(255,200,120,0.12)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none' }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 100, textDecoration: 'none' }}>Ver mis ayudas</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>
          {/* Breadcrumb */}
          <p style={{ fontSize: 12, color: '#7a4a1a', marginBottom: 28 }}>
            <Link href="/" style={{ color: '#7a4a1a', textDecoration: 'none' }}>Inicio</Link> › <Link href="/ayudas" style={{ color: '#7a4a1a', textDecoration: 'none' }}>Ayudas</Link> {ayuda.comunidad_autonoma && <> › <Link href={`/ayudas/ccaa/${slugCCAA(ayuda.comunidad_autonoma)}`} style={{ color: '#7a4a1a', textDecoration: 'none' }}>{ayuda.comunidad_autonoma}</Link></>} › {ayuda.nombre.slice(0,50)}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}>
            <div>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {ayuda.tipo && <span style={{ fontSize: 11, fontWeight: 700, color: '#FF8300', background: 'rgba(255,131,0,0.1)', padding: '3px 10px', borderRadius: 100 }}>{TIPO_LABEL[ayuda.tipo]||ayuda.tipo}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: ayuda.estado==='abierta' ? 'rgba(34,197,94,0.1)' : '#f5f5f5', color: ayuda.estado==='abierta' ? '#16a34a' : '#888' }}>{ayuda.estado==='abierta' ? '● Abierta' : 'Pendiente apertura'}</span>
                {ayuda.comunidad_autonoma && <span style={{ fontSize: 11, color: '#7a4a1a', background: '#FFF0E0', padding: '3px 10px', borderRadius: 100 }}>{ayuda.comunidad_autonoma}</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 8, color: '#1a0d00' }}>{ayuda.nombre}</h1>
              <p style={{ fontSize: 14, color: '#7a4a1a', marginBottom: 32, fontWeight: 500 }}>{ayuda.organismo}</p>

              {ayuda.descripcion && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>¿En qué consiste?</h2>
                  <p style={{ fontSize: 15, color: '#3a2010', lineHeight: 1.8 }}>{ayuda.descripcion}</p>
                </section>
              )}

              {ayuda.requisitos && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>Requisitos</h2>
                  <p style={{ fontSize: 15, color: '#3a2010', lineHeight: 1.8 }}>{ayuda.requisitos}</p>
                </section>
              )}

              {/* CTA */}
              <div style={{ background: '#321A00', borderRadius: 20, padding: '28px 24px', marginTop: 40 }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#FFF5EB', marginBottom: 8 }}>¿Esta ayuda es para ti?</p>
                <p style={{ fontSize: 14, color: 'rgba(255,245,235,0.55)', marginBottom: 20, lineHeight: 1.6 }}>Completa tu perfil en 2 minutos y te decimos exactamente qué ayudas te corresponden, incluyendo esta.</p>
                <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>Descubrir mis ayudas →</Link>
              </div>
            </div>

            {/* Sidebar ficha */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: '#FFFAF5', border: '1px solid #F5C89A', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5C89A', background: '#FFF5EB' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7a4a1a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>FICHA DE LA AYUDA</p>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  {[
                    ['Organismo', ayuda.organismo],
                    ['Ámbito', ayuda.ambito==='estatal' ? 'Estatal — toda España' : ayuda.ambito==='autonomico' ? `Autonómico — ${ayuda.comunidad_autonoma}` : 'Local'],
                    ['Tipo', TIPO_LABEL[ayuda.tipo]||ayuda.tipo],
                    importe ? ['Importe', importe] : null,
                    ayuda.fecha_fin ? ['Plazo', new Date(ayuda.fecha_fin).toLocaleDateString('es-ES')] : null,
                  ].filter(Boolean).map(([label, val]) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: '#7a4a1a', marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 13, color: '#1a0d00', fontWeight: 600 }}>{val}</p>
                    </div>
                  ))}
                </div>
                {ayuda.url_oficial && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', textAlign: 'center', background: '#321A00', color: '#FFE2C4', fontWeight: 700, fontSize: 13, padding: '11px 0', borderRadius: 100, textDecoration: 'none' }}>
                      Ver convocatoria oficial →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const { data } = await supabase.from('ayudas').select('slug').not('slug', 'is', null)
  return { paths: (data||[]).filter(a=>a.slug).map(a => ({ params: { slug: a.slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const { data } = await supabase.from('ayudas').select('*').eq('slug', params.slug).single()
  if (!data) return { notFound: true }
  return { props: { ayuda: data }, revalidate: 86400 }
}
