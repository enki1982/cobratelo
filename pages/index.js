import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FloatingCard, FloatingScene } from '../components/FloatingCard'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#321A00',
  surface: '#321A00',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,131,0,0.3)',
  green: '#FF8300',
  greenDim: 'rgba(255,131,0,0.10)',
  greenGlow: 'rgba(255,131,0,0.25)',
  text: '#FFF5EB',
  muted: 'rgba(240,240,245,0.5)',
  red: '#ff6b6b',
  blue: '#4a9eff',
}

const STEPS = [
  { n: '01', title: 'Cuéntanos tu situación', desc: 'Solo checkboxes. Sin formularios. 2 minutos para completar tu perfil.' },
  { n: '02', title: 'Analizamos tu perfil', desc: 'Cruzamos tu situación con todas las ayudas vigentes en España.' },
  { n: '03', title: 'Consulta las convocatorias', desc: 'Revisa importes, requisitos y enlaces oficiales antes de solicitar cada ayuda.' },
]

const AYUDAS_DEMO = [
  { icon: 'V', nombre: 'Bono Alquiler Joven 2026', org: 'Ministerio de Vivienda', importe: '2.400€', bg: 'rgba(255,131,0,0.12)' },
  { icon: 'D', nombre: 'Cupons ACCIÓ Digitalització', org: 'Generalitat de Catalunya', importe: '3.000€', bg: 'rgba(37,99,235,0.12)' },
  { icon: 'K', nombre: 'Kit Digital — Presencia web', org: 'Red.es · Gobierno de España', importe: '2.000€', bg: 'rgba(124,58,237,0.12)' },
  { icon: 'P', nombre: 'Prestació desocupació', org: 'SEPE', importe: '1.200€/mes', bg: 'rgba(245,158,11,0.12)' },
]

// Testimonios retirados hasta disponer de reseñas verificables.

const FUENTES_ADMIN = [
  { nombre: 'A·E·A·T', sub: 'Agencia Tributaria', color: '#003087', src: '/AgenciaTributaria.png' },
  { nombre: 'SEPE', sub: 'Empleo Público', color: '#0055A5', src: '/SEPE.png' },
  { nombre: 'Seg-Social', sub: 'Seguridad Social', color: '#004899', src: '/Logo_TGSS (1).svg' },
  { nombre: 'red.es', sub: 'Transformación Digital', color: '#CC0000', src: '/Logo_Red.es.svg' },
  { nombre: 'MIVAU', sub: 'Vivienda y Agenda Urbana', color: '#1B4F72', src: '/Vivienda.png' },
  { nombre: 'Gobierno·ES', sub: 'España', color: '#AA151B', src: '/Logotipo_del_Gobierno_de_España.svg' },
]

const FUENTES_CCAA = [
  { nombre: 'Generalitat', sub: 'Catalunya', color: '#C9222E', src: '/Logotipo_de_la_Generalitat_de_Catalunya.svg' },
  { nombre: 'C·Madrid', sub: 'Comunidad de Madrid', color: '#B5121B', src: '/Logotipo_del_Gobierno_de_la_Comunidad_de_Madrid.svg' },
  { nombre: 'J·Andalucía', sub: 'Junta de Andalucía', color: '#009A44', src: '/Juntadeandalucia.svg' },
  { nombre: 'G·Valencia', sub: 'Generalitat Valenciana', color: '#003A70', src: '/Imagotip_de_la_Generalitat_Valenciana.svg' },
  { nombre: 'G·Vasco', sub: 'Gobierno Vasco', color: '#D4342B', src: '/PaisVasco.png' },
  { nombre: 'Xunta', sub: 'Xunta de Galicia', color: '#003DA5', src: '/Flag_of_Galicia_(civil).svg' },
  { nombre: 'G·Aragón', sub: 'Gobierno de Aragón', color: '#C8102E', src: '/Logotipo_del_Gobierno_de_Aragón.svg' },
  { nombre: 'C·La·Mancha', sub: 'Castilla-La Mancha', color: '#B22222', src: '/Escudo_de_la_Junta_de_Comunidades_de_Castilla-La_Mancha.svg' },
  { nombre: 'C·y·León', sub: 'Castilla y León', color: '#7B0D1E', src: '/Logotipo_de_la_Junta_de_Castilla_y_León.svg' },
  { nombre: 'Asturias', sub: 'Principado de Asturias', color: '#003DA5', src: '/Logotipo_del_Gobierno_del_Principado_de_Asturias_(2022).svg' },
  { nombre: 'La·Rioja', sub: 'Gobierno de La Rioja', color: '#9E1B32', src: '/Logotipo_del_Gobierno_de_La_Rioja.svg' },
  { nombre: 'Murcia', sub: 'Región de Murcia', color: '#AA151B', src: '/Murcia.png' },
  { nombre: 'Navarra', sub: 'Gobierno de Navarra', color: '#CC0000', src: '/Navarra.png' },
]

function HoverCard({ children, style, hoverBorder, ...props }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...style, borderColor: hover && hoverBorder ? hoverBorder : style?.borderColor }}
      {...props}>
      {children}
    </div>
  )
}

export default function Home() {
  const [tienePerfil, setTienePerfil] = useState(false)
  const [perfilGuardado, setPerfilGuardado] = useState(null)
  const [esGestor, setEsGestor] = useState(false)
  const [haySesion, setHaySesion] = useState(false)
  const [totalAyudas, setTotalAyudas] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setHaySesion(true)
      const { data } = await supabase.from('usuarios').select('perfil, plan').eq('id', session.user.id).single()
      if (data?.perfil && Object.keys(data.perfil).length > 0) {
        setTienePerfil(true)
        setPerfilGuardado(data.perfil)
      }
      if (['starter', 'pro'].includes(data?.plan)) setEsGestor(true)
    })
    supabase.from('ayudas').select('*', { count: 'exact', head: true })
      .eq('activa', true)
      .gte('fecha_fin', new Date().toISOString().slice(0, 10))
      .then(({ count }) => { if (typeof count === 'number') setTotalAyudas(count) })
  }, [])

  // CTA principal según el tipo de usuario:
  // - Gestor (starter/pro): su acción es el panel, no buscar ayudas para sí mismo
  // - Cliente con perfil: ver sus ayudas
  // - Sin sesión / sin perfil: empezar gratis
  const ctaHref = esGestor
    ? '/gestor/expedientes'
    : (tienePerfil && perfilGuardado
        ? `/resultados?perfil=${encodeURIComponent(JSON.stringify(perfilGuardado))}`
        : '/perfil')
  const ctaLabelCorto = esGestor ? 'Mi panel' : (tienePerfil ? 'Mis ayudas' : 'Acceder')
  const ctaLabelLargo = esGestor ? 'Ir a mi panel →' : (tienePerfil ? 'Ver mis ayudas →' : 'Analizar mi caso gratis →')
  const ctaLabelFinal = esGestor ? 'Ir a mi panel →' : (tienePerfil ? 'Ver mis ayudas →' : 'Ver qué ayudas me corresponden →')

  return (
    <>
      <Head>
        <title>Cóbratelo.es — Las ayudas públicas que te corresponden</title>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "name": "Cóbratelo.es",
              "url": "https://www.cobratelo.es",
              "description": "Detectamos automáticamente las ayudas públicas que te corresponden en España: subvenciones, prestaciones y bonificaciones estatales, autonómicas y locales.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": { "@type": "EntryPoint", "urlTemplate": "https://www.cobratelo.es/ayudas?q={search_term_string}" },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "Organization",
              "name": "Cóbratelo.es",
              "url": "https://www.cobratelo.es",
              "logo": "https://www.cobratelo.es/logo.png",
              "contactPoint": { "@type": "ContactPoint", "email": "hola@cobratelo.es", "contactType": "customer service" }
            },
            {
              "@type": "SoftwareApplication",
              "name": "Cóbratelo.es",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "url": "https://www.cobratelo.es",
              "description": "Plataforma que identifica automáticamente las ayudas públicas, subvenciones y prestaciones a las que tiene derecho cada ciudadano en España.",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "description": "Gratuito para ciudadanos" }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": "¿Qué es Cóbratelo.es?", "acceptedAnswer": { "@type": "Answer", "text": "Cóbratelo.es es una plataforma gratuita que analiza tu situación personal y detecta automáticamente todas las ayudas públicas, subvenciones y prestaciones a las que tienes derecho en España: estatales, autonómicas y locales." } },
                { "@type": "Question", "name": "¿Es gratis?", "acceptedAnswer": { "@type": "Answer", "text": "Sí, completamente gratuito para ciudadanos. Sin registro previo necesario para ver tus ayudas." } },
                { "@type": "Question", "name": "¿Qué ayudas detecta?", "acceptedAnswer": { "@type": "Answer", "text": "Detecta miles de convocatorias activas verificadas: prestaciones de desempleo, ayudas al alquiler, bonos de digitalización, subvenciones autonómicas, ayudas por maternidad, ayudas para autónomos y mucho más." } },
                { "@type": "Question", "name": "¿Cómo funciona?", "acceptedAnswer": { "@type": "Answer", "text": "Completas un cuestionario de 2 minutos con tu situación laboral, ingresos, familia y municipio. El sistema cruza tu perfil con todas las convocatorias activas y te muestra las ayudas aplicables con sus importes e instrucciones." } }
              ]
            }
          ]
        })}} />
        <meta name="description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.cobratelo.es/" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cobratelo.es/" />
        <meta property="og:title" content="Cóbratelo.es — Las ayudas públicas que te corresponden" />
        <meta property="og:description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta property="og:image" content="https://www.cobratelo.es/og-image.png" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="Cóbratelo.es" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cóbratelo.es — Las ayudas públicas que te corresponden" />
        <meta name="twitter:description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="twitter:image" content="https://www.cobratelo.es/og-image.png" />
      </Head>

      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'sans-serif',
        backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 0%,rgba(255,131,0,0.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 20%,rgba(124,58,237,0.09) 0%,transparent 50%),radial-gradient(ellipse 50% 40% at 50% 80%,rgba(37,99,235,0.07) 0%,transparent 50%)`
      }}>

        {/* BLOQUE OSCURO: Nav + Hero */}
        <div style={{ background: 'radial-gradient(ellipse 55% 45% at 68% 22%, rgba(255,131,0,0.22) 0%, rgba(255,131,0,0.05) 45%, transparent 70%), radial-gradient(ellipse 35% 30% at 12% 75%, rgba(0,160,255,0.12) 0%, transparent 55%), #321A00', color: '#FFF5EB', color: '#FFF5EB' }}>

        {/* NAV */}
        <nav style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, background: 'rgba(13,17,23,0.90)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, padding: '0 24px' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <span className="font-display font-bold text-xl" style={{ letterSpacing: '-0.5px', color: C.text }}>
              cóbratelo<span style={{ color: C.green }}>.es</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link href="/precios" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }} className="hidden sm:block">Precios</Link>
              <Link href="/cuenta" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Mi cuenta</Link>
              <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 100, textDecoration: 'none', letterSpacing: '-0.2px' }}>
                {ctaLabelCorto}
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ maxWidth: 1024, margin: '0 auto', padding: '80px 24px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}
          className="!grid-cols-1 md:!grid-cols-2">
          <div>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(255,245,235,0.15)', color: 'rgba(255,245,235,0.5)', fontSize: 11, fontWeight: 500, padding: '5px 14px', borderRadius: 100, marginBottom: 28, letterSpacing: '1px', width: 'fit-content' }}>
              {totalAyudas === null ? 'Buscador de ayudas públicas en España' : `${totalAyudas} convocatorias activas en la plataforma`}
            </div>

            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(32px,4.5vw,54px)', lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 24, color: C.text }}>
              Encuentra ayudas públicas
que podrían corresponderte
            </h1>

            <p style={{ color: 'rgba(255,245,235,0.65)', fontSize: 16, lineHeight: 1.75, marginBottom: 40, maxWidth: 440 }}>
              Analiza tu situación en unos minutos y encuentra convocatorias que podrían encajar contigo. Consulta requisitos, importes y fuentes oficiales antes de solicitarlas.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100, textDecoration: 'none' }}>
                {ctaLabelLargo}
              </Link>
              <Link href="/precios?tab=gestoria" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>
                Descubre el CRM para gestorías →
              </Link>
            </div>

            {/* Trust layer */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, marginBottom: 32 }}>
              {['Actualizado automáticamente', 'Estatal, autonómico y local', 'Compatible con tu gestoría'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#FF8300', fontSize: 11, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,245,235,0.38)' }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 0, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              {[{ num: totalAyudas === null ? '—' : totalAyudas, lbl: 'Convocatorias activas' }, { num: '0€', lbl: 'Para ciudadanos' }, { num: '149€', lbl: 'Standard gestorías / mes + IVA' }].map((s, i) => (
                <div key={i}>
                  <div className="font-display font-bold" style={{ fontSize: 26, letterSpacing: '-1px', color: C.text }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,245,235,0.65)', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Banner gestorías — versión móvil (en desktop va en el dashboard) */}
            <Link href="/gestores" className="block md:hidden" style={{ textDecoration: 'none', marginTop: 32 }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(255,131,0,0.10), rgba(255,131,0,0.02))', border: '1px solid rgba(255,131,0,0.28)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>¿Eres gestoría o asesoría?</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>CRM de ayudas · clientes ilimitados · 149€/mes + IVA</div>
                </div>
                <span style={{ flexShrink: 0, background: C.green, color: '#000', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>Entrar →</span>
              </div>
            </Link>
          </div>

          {/* Dashboard */}
          <FloatingScene style={{ position: 'relative' }} className="hidden md:block">
            {/* Glow ambiental de fondo */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(255,131,0,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Banner gestorías — capta al profesional al entrar */}
            <Link href="/gestores" style={{ textDecoration: 'none', display: 'block', marginBottom: 48, position: 'relative', zIndex: 1 }}>
              <HoverCard hoverBorder="rgba(255,131,0,0.55)" style={{ background: 'linear-gradient(135deg, rgba(255,131,0,0.10), rgba(255,131,0,0.02))', border: '1px solid rgba(255,131,0,0.28)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.2s', backdropFilter: 'blur(8px)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>¿Eres gestoría o asesoría?</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>CRM de ayudas · clientes ilimitados · 149€/mes + IVA</div>
                </div>
                <span style={{ flexShrink: 0, background: C.green, color: '#000', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>Entrar →</span>
              </HoverCard>
            </Link>

            <FloatingCard depth={2} glowColor="rgba(255,131,0,0.22)" style={{ background: '#2a1500', border: '1px solid rgba(255,131,0,0.3)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)`, opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Ejemplo de resultado</span>
                <span style={{ background: C.greenDim, color: C.green, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>Datos de muestra</span>
              </div>
              {AYUDAS_DEMO.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div>
                    <div style={{ fontSize: 11, color: '#7a4a1a', marginTop: 2 }}>{a.org}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.green, flexShrink: 0 }}>{a.importe}</div>
                </div>
              ))}
            </FloatingCard>

            {/* Float top-right */}
            <FloatingCard depth={3} glowColor="rgba(255,131,0,0.3)" style={{ position: 'absolute', top: 110, right: -24, background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(255,131,0,0.25)', borderRadius: 16, padding: '12px 18px', textAlign: 'center', backdropFilter: 'blur(20px)', zIndex: 3 }}>
              <div className="font-display font-bold" style={{ fontSize: 32, color: C.green, letterSpacing: '-1px', lineHeight: 1 }}>14</div>
              <div style={{ fontSize: 11, color: '#7a4a1a', marginTop: 2 }}>ayudas para ti</div>
            </FloatingCard>

            {/* Float bottom-left */}
            <FloatingCard depth={2} glowColor="rgba(255,131,0,0.15)" style={{ position: 'absolute', bottom: -16, left: -20, background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(20px)', zIndex: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.greenDim, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}><svg width='10' height='8' viewBox='0 0 10 8' fill='none'><path d='M1 4L3.5 6.5L9 1' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'/></svg></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Perfil completado</div>
                <div style={{ fontSize: 10, color: C.muted }}>Resultados actualizados</div>
              </div>
            </FloatingCard>
          </FloatingScene>
        </section>

        </div>{/* FIN BLOQUE OSCURO */}

        {/* Plan profesional Standard */}
        <section style={{ background: '#FFF5EB', color: '#321A00', padding: '64px 24px' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 32, alignItems: 'center' }}>
            <div>
              <p style={{ color: '#AD4F00', fontSize: 12, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Para gestorías y asesorías</p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(27px,3.4vw,42px)', lineHeight: 1.15, marginBottom: 16 }}>Todos tus clientes. Un solo plan.</h2>
              <p style={{ lineHeight: 1.7, color: '#63472F', marginBottom: 20 }}>Organiza clientes y expedientes, consulta ayudas, gestiona alertas y exporta información desde un único CRM profesional.</p>
              <Link href="/gestores" style={{ display: 'inline-block', background: '#FF8300', color: '#201000', padding: '14px 24px', fontWeight: 800, borderRadius: 100, textDecoration: 'none' }}>Descubre el CRM para gestorías →</Link>
            </div>
            <div style={{ background: '#321A00', borderRadius: 22, padding: 28, color: '#FFF5EB', border: '1px solid rgba(255,131,0,.3)' }}>
              <p style={{ color: '#FFB46B', fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>STANDARD</p>
              <div style={{ fontSize: 42, fontWeight: 800 }}>149 €<span style={{ fontSize: 15, fontWeight: 400 }}> / mes + IVA</span></div>
              <p style={{ color: '#E9CCB0', fontSize: 13, margin: '10px 0 22px' }}>Sin límite de clientes ni expedientes</p>
              {['CRM y seguimiento de expedientes', 'Alertas personalizadas', 'Exportación masiva e historial', 'Soporte prioritario'].map(item => (
                <p key={item} style={{ margin: '10px 0', fontSize: 14 }}><span style={{ color: '#FF8300', marginRight: 10 }}>✓</span>{item}</p>
              ))}
              <Link href="/precios?tab=gestoria" style={{ display: 'block', textAlign: 'center', marginTop: 24, background: '#FF8300', color: '#201000', padding: 13, borderRadius: 100, textDecoration: 'none', fontWeight: 800 }}>Ver el plan Standard →</Link>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ background: '#FFE2C4', color: '#1a0d00', borderTop: '1px solid #F5C89A', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#cc5500', marginBottom: 12 }}>Cómo funciona</p>
          <h2 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-1.5px', color: '#1a0d00', marginBottom: 48 }}>
            Descubre oportunidades y consulta los requisitos oficiales.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="!grid-cols-1 md:!grid-cols-3">
            {STEPS.map((s, i) => (
              <HoverCard key={i} hoverBorder={C.borderHover} style={{ background: '#ffffff', border: '1px solid #F5C89A', borderRadius: 16, padding: 24, transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#cc5500', marginBottom: 8, letterSpacing: '1px' }}>{s.n}</div>
                <div className="font-display font-bold" style={{ fontSize: 15, color: '#1a0d00', marginBottom: 8, letterSpacing: '-0.3px' }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#666660', lineHeight: 1.6 }}>{s.desc}</p>
              </HoverCard>
            ))}
            </div>
          </div>
        </section>

        {/* FUENTES — Marquee horizontal */}
        <section style={{ background: '#FFE2C4', color: '#1a0d00', borderTop: '1px solid #F5C89A', width: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '36px 0' }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#7a4a1a', marginBottom: 24 }}>
              FUENTES OFICIALES VERIFICADAS · ACTUALIZACIÓN CONTINUA
            </p>
            {/* Fila 1: Administración General del Estado → */}
            <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(to right, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(to left, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div className='marquee-track' style={{ display: 'flex', gap: 12, width: 'max-content' }}>
                {[...FUENTES_ADMIN, ...FUENTES_ADMIN, ...FUENTES_ADMIN].map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 12, border: '1px solid #F5C89A', background: '#fff', minWidth: 100, flexShrink: 0 }}>
                    <img src={f.src} alt={f.nombre} style={{ height: 30, width: 'auto', maxWidth: 120, objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Fila 2: Comunidades Autónomas ← (sentido contrario) */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(to right, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(to left, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div className='marquee-track-reverse' style={{ display: 'flex', gap: 12, width: 'max-content' }}>
                {[...FUENTES_CCAA, ...FUENTES_CCAA].map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 12, border: '1px solid #F5C89A', background: '#fff', minWidth: 100, flexShrink: 0 }}>
                    <img src={f.src} alt={f.nombre} style={{ height: 30, width: 'auto', maxWidth: 120, objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

                {/* ── CTA FINAL ── */}
        <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px 48px' }}>
          <div style={{ background: '#321A00', border: 'none', borderRadius: 24, padding: '72px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)` }} />
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(24px,3vw,40px)', letterSpacing: '-1px', color: '#FFF5EB', marginBottom: 20, fontWeight: 700 }}>
              La forma moderna de conectar ciudadanos,
ayudas públicas y gestorías.
            </h2>
            <p style={{ color: 'rgba(240,240,245,0.6)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Una plataforma para ciudadanos que quieren cobrar lo que les corresponde,
y para gestorías que quieren crecer sin trabajar más.
            </p>
            <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
              {ctaLabelFinal}
            </Link>
            <div style={{ marginTop: 22 }}>
              <Link href="/gestores" style={{ color: '#FFB46B', fontSize: 15, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 5 }}>
                ¿Tienes una gestoría? Conoce Standard por 149 €/mes + IVA →
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: '#321A00', borderTop: '1px solid rgba(255,131,0,0.15)', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '48px 24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 40 }}>
              <div>
                <span className="font-display font-bold" style={{ color: '#FFF5EB', fontSize: 18, display: 'block', marginBottom: 10 }}>
                  cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
                </span>
                <p style={{ color: 'rgba(255,245,235,0.4)', fontSize: 12, lineHeight: 1.7 }}>
                  Detectamos las ayudas públicas que te corresponden. Sin buscar. Sin burocracia.
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,245,235,0.35)', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>PRODUCTO</p>
                {[['Cómo funciona', '/'], ['Para gestorías', '/precios?tab=gestoria'], ['Precios', '/precios'], ['Sobre nosotros', '/sobre-nosotros'], ['Ayudas en España', '/ayudas']].map(([l,h]) => (
                  <Link key={l} href={h} style={{ color: 'rgba(255,245,235,0.55)', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 10 }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ color: 'rgba(255,245,235,0.35)', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>LEGAL</p>
                {[['Aviso Legal', '/aviso-legal'], ['Privacidad', '/privacidad'], ['Términos', '/terminos']].map(([l,h]) => (
                  <Link key={l} href={h} style={{ color: 'rgba(255,245,235,0.55)', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 10 }}>{l}</Link>
                ))}
              </div>
              <div>
                <p style={{ color: 'rgba(255,245,235,0.35)', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>CONTACTO</p>
                <a href="mailto:hola@cobratelo.es" style={{ color: '#FF8300', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 10 }}>hola@cobratelo.es</a>
                <p style={{ color: 'rgba(255,245,235,0.35)', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>Respondemos en menos de 24h en días laborables.</p>
                <a
                  href="https://www.linkedin.com/company/cobratelo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Cóbratelo.es en LinkedIn"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'rgba(255,131,0,0.1)', border: '1px solid rgba(255,131,0,0.25)', transition: 'all 0.2s', marginRight: 10 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E8540A'; e.currentTarget.style.borderColor = '#E8540A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,131,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,131,0,0.25)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF5EB" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/cobratelo.es/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Cóbratelo.es en Instagram"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'rgba(255,131,0,0.1)', border: '1px solid rgba(255,131,0,0.25)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E8540A'; e.currentTarget.style.borderColor = '#E8540A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,131,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,131,0,0.25)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF5EB" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,131,0,0.12)', marginBottom: 24 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <p style={{ color: 'rgba(255,245,235,0.25)', fontSize: 12 }}>© 2026 Cóbratelo.es · Los resultados son orientativos. Consulta siempre las fuentes oficiales.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
