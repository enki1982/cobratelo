import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FloatingCard, FloatingScene } from '../components/FloatingCard'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#09090f',
  surface: '#0f0f1a',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(0,232,122,0.3)',
  green: '#00e87a',
  greenDim: 'rgba(0,232,122,0.10)',
  greenGlow: 'rgba(0,232,122,0.25)',
  text: '#f0f0f5',
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
  { icon: 'V', nombre: 'Bono Alquiler Joven 2026', org: 'Ministerio de Vivienda', importe: '2.400€', bg: 'rgba(0,232,122,0.12)' },
  { icon: 'D', nombre: 'Cupons ACCIÓ Digitalització', org: 'Generalitat de Catalunya', importe: '3.000€', bg: 'rgba(37,99,235,0.12)' },
  { icon: 'K', nombre: 'Kit Digital — Presencia web', org: 'Red.es · Gobierno de España', importe: '2.000€', bg: 'rgba(124,58,237,0.12)' },
  { icon: 'P', nombre: 'Prestació desocupació', org: 'SEPE', importe: '1.200€/mes', bg: 'rgba(245,158,11,0.12)' },
]

const FUENTES = [
  { nombre: 'A·E·A·T', sub: 'Agencia Tributaria', color: '#003087', border: '#003087', src: '/Agencia_Tributaria.svg' },
  { nombre: 'SEPE', sub: 'Empleo Público', color: '#0055A5', border: '#0055A5', src: '/SEPE.svg' },
  { nombre: 'Seg-Social', sub: 'Seguridad Social', color: '#004899', border: '#004899', src: '/Logo_TGSS (1).svg' },
  { nombre: 'red.es', sub: 'Transformación Digital', color: '#CC0000', border: '#CC0000', src: '/Logo_Red.es.svg' },
  { nombre: 'MIVAU', sub: 'Vivienda y Agenda Urbana', color: '#1B4F72', border: '#1B4F72', src: '/Logotipo_del_Ministerio_de_Vivienda_y_Agenda_Urbana.svg' },
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
        <meta name="description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'sans-serif',
        backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 0%,rgba(0,232,122,0.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 20%,rgba(124,58,237,0.09) 0%,transparent 50%),radial-gradient(ellipse 50% 40% at 50% 80%,rgba(37,99,235,0.07) 0%,transparent 50%)`
      }}>

        {/* BLOQUE OSCURO: Nav + Hero */}
        <div style={{ background: 'radial-gradient(ellipse 55% 45% at 68% 22%, rgba(0,232,122,0.22) 0%, rgba(0,232,122,0.05) 45%, transparent 70%), radial-gradient(ellipse 35% 30% at 12% 75%, rgba(0,160,255,0.12) 0%, transparent 55%), #030303', color: '#f0f0f5', color: '#f0f0f5' }}>

        {/* NAV */}
        <nav style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(13,17,23,0.90)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, padding: '0 24px' }}>
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.greenDim, border: `1px solid rgba(0,232,122,0.25)`, color: C.green, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 100, marginBottom: 24 }}>
              {totalAyudas}+ convocatorias activas en España
            </div>

            <h1 className="font-display font-bold" style={{ fontSize: 'clamp(36px,5vw,58px)', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 20, color: C.text }}>
              ¿Qué ayudas{' '}
              <span style={{ background: 'linear-gradient(135deg,#00e87a 0%,#00c4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                puedes cobrar tú?
              </span>
            </h1>

            <p style={{ color: '#666660', fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 420 }}>
              Analizamos tu perfil y te decimos exactamente qué ayudas públicas puedes cobrar tú. Sin buscar. Sin burocracia. Sin perderte en portales. En 2 minutos. Gratis.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100, textDecoration: 'none' }}>
                {tienePerfil ? 'Ver mis ayudas →' : 'Analizar mi caso gratis →'}
              </Link>
              <Link href="/precios" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>
                Para gestorías →
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 40, paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
              {[{ num: `${totalAyudas}+`, lbl: 'Ayudas analizadas' }, { num: '2 min', lbl: 'Análisis completo' }, { num: '0€', lbl: 'Siempre gratis' }].map((s, i) => (
                <div key={i}>
                  <div className="font-display font-bold" style={{ fontSize: 26, letterSpacing: '-1px', color: C.text }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard */}
          <FloatingScene style={{ position: 'relative' }} className="hidden md:block">
            {/* Glow ambiental de fondo */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(0,232,122,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            <FloatingCard depth={2} glowColor="rgba(0,232,122,0.22)" style={{ background: '#161b27', border: '1px solid rgba(0,232,122,0.3)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
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
                    <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>{a.org}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.green, flexShrink: 0 }}>{a.importe}</div>
                </div>
              ))}
            </FloatingCard>

            {/* Float top-right */}
            <FloatingCard depth={3} glowColor="rgba(0,232,122,0.3)" style={{ position: 'absolute', top: -20, right: -24, background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(0,232,122,0.25)', borderRadius: 16, padding: '12px 18px', textAlign: 'center', backdropFilter: 'blur(20px)', zIndex: 2 }}>
              <div className="font-display font-bold" style={{ fontSize: 32, color: C.green, letterSpacing: '-1px', lineHeight: 1 }}>14</div>
              <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>ayudas para ti</div>
            </FloatingCard>

            {/* Float bottom-left */}
            <FloatingCard depth={2} glowColor="rgba(0,232,122,0.15)" style={{ position: 'absolute', bottom: -16, left: -20, background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(20px)', zIndex: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.greenDim, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}><svg width='10' height='8' viewBox='0 0 10 8' fill='none'><path d='M1 4L3.5 6.5L9 1' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'/></svg></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Perfil completado</div>
                <div style={{ fontSize: 10, color: C.muted }}>Resultados actualizados</div>
              </div>
            </FloatingCard>
          </FloatingScene>
        </section>

        </div>{/* FIN BLOQUE OSCURO */}

        {/* CASO REAL */}
        <section style={{ background: '#111110', borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: C.green, marginBottom: 20, textAlign: 'center' }}>
              EJEMPLO REAL
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { perfil: 'Autónomo · Barcelona · 38 años', resultado: '11 ayudas detectadas', importe: '12.400€', detalle: 'Kit Digital, Cuota cero autónomos, Bono Alquiler Joven, ACCIÓ digitalización...' },
                { perfil: 'Familia numerosa · Madrid · 3 hijos', resultado: '8 ayudas detectadas', importe: '6.800€', detalle: 'Becas comedor, ayuda libros, bonificación transporte, ayuda guardería...' },
                { perfil: 'Pyme · Sevilla · 6 empleados', resultado: '14 ayudas detectadas', importe: '28.500€', detalle: 'Bonificaciones SS, Kit Digital, FEDER, subvención Junta Andalucía...' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 20px' }}>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{c.perfil}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: C.green, marginBottom: 4 }}>{c.importe}</p>
                  <p style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 8 }}>{c.resultado}</p>
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{c.detalle}</p>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
              Los importes son orientativos y dependen de cada convocatoria y situación particular.
            </p>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ background: '#F7F3EC', color: '#111110', borderTop: '1px solid #E0DAD0', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#2D6A4F', marginBottom: 12 }}>Cómo funciona</p>
          <h2 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-1.5px', color: '#111110', marginBottom: 48 }}>
            Sin buscar. Sin perderse. Sin burocracia.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="!grid-cols-1 md:!grid-cols-3">
            {STEPS.map((s, i) => (
              <HoverCard key={i} hoverBorder={C.borderHover} style={{ background: '#ffffff', border: '1px solid #E0DAD0', borderRadius: 16, padding: 24, transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2D6A4F', marginBottom: 8, letterSpacing: '1px' }}>{s.n}</div>
                <div className="font-display font-bold" style={{ fontSize: 15, color: '#111110', marginBottom: 8, letterSpacing: '-0.3px' }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#666660', lineHeight: 1.6 }}>{s.desc}</p>
              </HoverCard>
            ))}
            </div>
          </div>
        </section>

        {/* FUENTES — Marquee horizontal */}
        <section style={{ background: '#F7F3EC', color: '#111110', borderTop: '1px solid #E0DAD0', width: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '36px 0' }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#888882', marginBottom: 24 }}>
              FUENTES OFICIALES VERIFICADAS · ACTUALIZACIÓN CONTINUA
            </p>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, #F7F3EC, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to left, #F7F3EC, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div className='marquee-track' style={{ display: 'flex', gap: 16, width: 'max-content' }}>
                {[...FUENTES, ...FUENTES].map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: f.src ? '10px 20px' : '12px 20px', borderRadius: 12, border: '1px solid #E0DAD0', background: '#fff', minWidth: 110, flexShrink: 0 }}>
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

        {/* GESTORÍAS */}
        <section style={{ background: '#F7F3EC', color: '#111110', borderTop: '1px solid #E0DAD0', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="!grid-cols-1 md:!grid-cols-2">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2D6A4F', marginBottom: 12 }}>Para gestorías y despachos</p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(28px,3vw,44px)', letterSpacing: '-1.5px', color: '#111110', marginBottom: 16, lineHeight: 1.1, fontFamily: 'Syne, sans-serif' }}>
                Más ingresos para tu gestoría.<br />Sin trabajo extra.
              </h2>
              <p style={{ color: '#666660', fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 420 }}>
                Cada cliente tuyo tiene ayudas que no conoce. Cóbratelo las detecta, genera el informe y tú cobras la gestión — sin buscar, sin burocracia, sin trabajo extra.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                {['Detecta ayudas de todos tus clientes automáticamente','Informe personalizado listo para presentar','Alertas cuando aparecen nuevas ayudas para cada cliente','Starter hasta 50 clientes · Pro ilimitado'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#666660' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.greenDim, border: `1px solid rgba(0,232,122,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.green, flexShrink: 0 }}><svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{display:'block'}}><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/precios?tab=gestoria" style={{ background: '#2D6A4F', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 100, textDecoration: 'none' }}>
                  Probar 7 días gratis →
                </Link>
                <span style={{ fontSize: 13, color: C.muted }}>Sin tarjeta de crédito</span>
              </div>
            </div>
            <FloatingCard depth={1.5} glowColor="rgba(45,106,79,0.2)" style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#2D6A4F', opacity: 0.15 }} />
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#B0AAA0', marginBottom: 20 }}>Panel de gestión</p>
              {[
                { nombre: 'García Martínez, J.', ayudas: 8, importe: '12.400€', estado: 'Pendiente' },
                { nombre: 'López Sánchez, M.', ayudas: 5, importe: '7.200€', estado: 'Tramitado' },
                { nombre: 'Fernández García, A.', ayudas: 11, importe: '18.600€', estado: 'Pendiente' },
                { nombre: 'Ruiz Pérez, C.', ayudas: 3, importe: '4.100€', estado: 'En proceso' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,240,245,0.5)', marginTop: 2 }}>{c.ayudas} ayudas · {c.importe}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                    background: c.estado === 'Tramitado' ? 'rgba(0,232,122,0.1)' : c.estado === 'En proceso' ? 'rgba(37,99,235,0.1)' : 'rgba(245,158,11,0.1)',
                    color: c.estado === 'Tramitado' ? C.green : c.estado === 'En proceso' ? '#60a5fa' : '#f59e0b'
                  }}>{c.estado}</span>
                </div>
              ))}
            </FloatingCard>
          </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ background: '#111110', border: 'none', borderRadius: 24, padding: '60px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)` }} />
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(24px,3vw,42px)', letterSpacing: '-1.5px', color: '#f0f0f5', marginBottom: 16 }}>
              La mayoría de ayudas no se piden porque nadie sabe que existen
            </h2>
            <p style={{ color: 'rgba(240,240,245,0.6)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              No hay que buscar entre miles de subvenciones ni entender la burocracia. En 2 minutos te decimos exactamente qué puedes cobrar tú, con enlace directo a cada trámite.
            </p>
            <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
              {tienePerfil ? 'Ver mis ayudas →' : 'Ver qué ayudas me corresponden →'}
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: '#F7F3EC', borderTop: '1px solid #E0DAD0', width: '100%' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span className="font-display font-bold" style={{ color: '#111110' }}>cóbratelo<span style={{ color: '#2D6A4F' }}>.es</span></span>
            <p style={{ color: '#888882', fontSize: 12, textAlign: 'center' }}>
              Los resultados son orientativos. Consulta siempre las fuentes oficiales.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, fontSize: 12, color: C.muted }}>
              {[['Precios','/precios'],['Aviso Legal','/aviso-legal'],['Privacidad','/privacidad'],['Términos','/terminos']].map(([l,h]) => (
                <Link key={h} href={h} style={{ color: '#888882', textDecoration: 'none' }}>{l}</Link>
              ))}
              <a href="mailto:hola@cobratelo.es" style={{ color: '#888882', textDecoration: 'none' }}>hola@cobratelo.es</a>
            </div>
            <div className="legal-hover-wrap">
              <span className="legal-trigger">Información del titular</span>
              <div className="legal-tooltip">
                <strong>Miquel Nogueras Camero</strong><br/>
                NIF 77609795K · Carrer del Roser, 21 · 08185 Lliçà de Vall (Barcelona)<br/>
                <a href="mailto:hola@cobratelo.es" style={{color:'#2d6a4f'}}>hola@cobratelo.es</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
