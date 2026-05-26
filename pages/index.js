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
  { n: '03', title: 'Cobra lo tuyo', desc: 'Lista con importes, requisitos y enlace oficial de cada ayuda.' },
]

const AYUDAS_DEMO = [
  { icon: 'V', nombre: 'Bono Alquiler Joven 2026', org: 'Ministerio de Vivienda', importe: '2.400€', bg: 'rgba(255,131,0,0.12)' },
  { icon: 'D', nombre: 'Cupons ACCIÓ Digitalització', org: 'Generalitat de Catalunya', importe: '3.000€', bg: 'rgba(37,99,235,0.12)' },
  { icon: 'K', nombre: 'Kit Digital — Presencia web', org: 'Red.es · Gobierno de España', importe: '2.000€', bg: 'rgba(124,58,237,0.12)' },
  { icon: 'P', nombre: 'Prestació desocupació', org: 'SEPE', importe: '1.200€/mes', bg: 'rgba(245,158,11,0.12)' },
]

const FUENTES = [
  { nombre: 'A·E·A·T', sub: 'Agencia Tributaria', color: '#003087', border: '#003087', src: '/AgenciaTributaria.png' },
  { nombre: 'SEPE', sub: 'Empleo Público', color: '#0055A5', border: '#0055A5', src: '/SEPE.png' },
  { nombre: 'Seg-Social', sub: 'Seguridad Social', color: '#004899', border: '#004899', src: '/Logo_TGSS (1).svg' },
  { nombre: 'red.es', sub: 'Transformación Digital', color: '#CC0000', border: '#CC0000', src: '/Logo_Red.es.svg' },
  { nombre: 'MIVAU', sub: 'Vivienda y Agenda Urbana', color: '#1B4F72', border: '#1B4F72', src: '/Vivienda.png' },
  { nombre: 'Generalitat', sub: 'Catalunya', color: '#C9222E', border: '#C9222E', src: '/Logotipo_de_la_Generalitat_de_Catalunya.svg' },
  { nombre: 'C·Madrid', sub: 'Comunidad de Madrid', color: '#B5121B', border: '#B5121B', src: '/Logotipo_del_Gobierno_de_la_Comunidad_de_Madrid.svg' },
  { nombre: 'Gobierno·ES', sub: 'España', color: '#AA151B', border: '#AA151B', src: '/Logotipo_del_Gobierno_de_España.svg' },
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
  const [totalAyudas, setTotalAyudas] = useState(66)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('usuarios').select('perfil').eq('id', session.user.id).single()
      if (data?.perfil && Object.keys(data.perfil).length > 0) {
        setTienePerfil(true)
        setPerfilGuardado(data.perfil)
      }
    })
    supabase.from('ayudas').select('*', { count: 'exact', head: true })
      .in('estado', ['abierta', 'permanente', 'pendiente'])
      .then(({ count }) => { if (count) setTotalAyudas(count) })
  }, [])

  const ctaHref = tienePerfil && perfilGuardado
    ? `/resultados?perfil=${encodeURIComponent(JSON.stringify(perfilGuardado))}`
    : '/perfil'

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
            }
          ]
        })}} />
        <meta name="description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
                {tienePerfil ? 'Mis ayudas' : 'Empezar gratis'}
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ maxWidth: 1024, margin: '0 auto', padding: '80px 24px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
          className="!grid-cols-1 md:!grid-cols-2">
          <div>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(255,245,235,0.15)', color: 'rgba(255,245,235,0.5)', fontSize: 11, fontWeight: 500, padding: '5px 14px', borderRadius: 100, marginBottom: 28, letterSpacing: '1px' }}>
              {totalAyudas}+ convocatorias activas en España
            </div>

            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(32px,4.5vw,54px)', lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 24, color: C.text }}>
              Descubre las ayudas públicas
que te corresponden
            </h1>

            <p style={{ color: 'rgba(255,245,235,0.65)', fontSize: 16, lineHeight: 1.75, marginBottom: 40, maxWidth: 440 }}>
              Analizamos tu situación y detectamos automáticamente subvenciones, prestaciones y ayudas disponibles para ti. Sin buscar. Sin burocracia. En solo 2 minutos.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100, textDecoration: 'none' }}>
                {tienePerfil ? 'Ver mis ayudas →' : 'Analizar mi caso gratis →'}
              </Link>
              <Link href="/precios" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>
                Para gestorías →
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
              {[{ num: `${totalAyudas}+`, lbl: 'Ayudas analizadas' }, { num: '2 min', lbl: 'Análisis completo' }, { num: '0€', lbl: 'Siempre gratis' }].map((s, i) => (
                <div key={i}>
                  <div className="font-display font-bold" style={{ fontSize: 26, letterSpacing: '-1px', color: C.text }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#7a4a1a', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard */}
          <FloatingScene style={{ position: 'relative' }} className="hidden md:block">
            {/* Glow ambiental de fondo */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(255,131,0,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

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
            <FloatingCard depth={3} glowColor="rgba(255,131,0,0.3)" style={{ position: 'absolute', top: -20, right: -24, background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(255,131,0,0.25)', borderRadius: 16, padding: '12px 18px', textAlign: 'center', backdropFilter: 'blur(20px)', zIndex: 2 }}>
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

        {/* CÓMO FUNCIONA */}
        <section style={{ background: '#FFE2C4', color: '#1a0d00', borderTop: '1px solid #F5C89A', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#cc5500', marginBottom: 12 }}>Cómo funciona</p>
          <h2 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-1.5px', color: '#1a0d00', marginBottom: 48 }}>
            Sin buscar. Sin perderse. Sin burocracia.
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
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to left, #FFE2C4, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div className='marquee-track' style={{ display: 'flex', gap: 16, width: 'max-content' }}>
                {[...FUENTES, ...FUENTES].map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: f.src ? '10px 20px' : '12px 20px', borderRadius: 12, border: '1px solid #F5C89A', background: '#fff', minWidth: 110, flexShrink: 0 }}>
                    {f.src ? (
                      <img src={f.src} alt={f.nombre} style={{ height: 32, width: 'auto', maxWidth: 130, objectFit: 'contain' }} />
                    ) : (
                      <>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: f.color, letterSpacing: '-0.3px', lineHeight: 1 }}>{f.nombre}</span>
                        <span style={{ fontSize: 9, color: '#999', marginTop: 3, letterSpacing: '0.2px' }}>{f.sub}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

                {/* ── BIFURCACIÓN B2B — ELEGANTE ── */}
        <section style={{ background: '#fff', width: '100%', borderTop: '1px solid #F5C89A' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '48px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
              {/* Left — contexto */}
              <div style={{ maxWidth: 480 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#FF8300', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>PARA GESTORÍAS Y ASESORES</p>
                <h2 className="font-display font-bold" style={{ fontSize: 'clamp(22px,3vw,30px)', color: '#1a0d00', letterSpacing: '-0.8px', marginBottom: 12, lineHeight: 1.2 }}>
                  También ayudamos a gestorías y asesores
                </h2>
                <p style={{ fontSize: 15, color: '#7a4a1a', lineHeight: 1.7, marginBottom: 24 }}>
                  Centraliza solicitudes, recibe nuevos clientes y automatiza la detección de ayudas para todos tus clientes. Sin trabajo extra.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link href="/precios" style={{ background: '#321A00', color: '#FFE2C4', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 100, textDecoration: 'none' }}>
                    Soy gestoría →
                  </Link>
                  <Link href="/precios" style={{ fontSize: 13, color: '#7a4a1a', textDecoration: 'none', fontWeight: 500 }}>
                    Ver planes de gestoría
                  </Link>
                </div>
              </div>
              {/* Right — mini panel gestoría */}
              <div style={{ background: '#321A00', borderRadius: 20, padding: '24px', minWidth: 280, boxShadow: '0 8px 32px rgba(50,26,0,0.15)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,245,235,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>PANEL GESTORÍA</p>
                {[
                  { nombre: 'García Martínez, J.', ayudas: 8, importe: '12.400€', estado: 'Pendiente', color: '#FF8300' },
                  { nombre: 'López Sánchez, M.', ayudas: 5, importe: '7.200€', estado: 'Tramitado', color: '#4ade80' },
                  { nombre: 'Fernández García, A.', ayudas: 11, importe: '18.600€', estado: 'Pendiente', color: '#FF8300' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,200,120,0.08)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#FFF5EB', marginBottom: 2 }}>{c.nombre}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.35)' }}>{c.ayudas} ayudas · {c.importe}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: c.color + '18', padding: '3px 9px', borderRadius: 100 }}>{c.estado}</span>
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
              {tienePerfil ? 'Ver mis ayudas →' : 'Ver qué ayudas me corresponden →'}
            </Link>
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
                {[['Cómo funciona', '/'], ['Para gestorías', '/precios'], ['Precios', '/precios'], ['Sobre nosotros', '/sobre-nosotros'], ['Ayudas en España', '/ayudas']].map(([l,h]) => (
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
                <p style={{ color: 'rgba(255,245,235,0.35)', fontSize: 12, lineHeight: 1.6 }}>Respondemos en menos de 24h en días laborables.</p>
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
