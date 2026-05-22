import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  { nombre: 'A.E.A.T.', sub: 'Agencia Tributaria', color: '#003087' },
  { nombre: 'SEPE', sub: 'Servicio Público Empleo', color: '#0055A5' },
  { nombre: 'Seg. Social', sub: 'Ministerio de Inclusión', color: '#004899' },
  { nombre: 'Red.es', sub: 'Ministerio Digital', color: '#CC0000' },
  { nombre: 'MIVAU', sub: 'Ministerio de Vivienda', color: '#1B4F72' },
  { nombre: 'Generalitat', sub: 'Catalunya', color: '#C9222E' },
  { nombre: 'C. Madrid', sub: 'Comunidad de Madrid', color: '#E3000F' },
  { nombre: 'IMSERSO', sub: 'Mayores y dependencia', color: '#004899' },
  { nombre: 'ACCIÓ', sub: 'Competitivitat Empresa', color: '#C9222E' },
  { nombre: 'Red SARA', sub: 'Administración digital', color: '#2D4A6A' },
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
        <div style={{ background: '#0d1117', backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 0%,rgba(0,232,122,0.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 20%,rgba(124,58,237,0.09) 0%,transparent 50%)', color: '#f0f0f5' }}>

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
              Cobra todo lo que{' '}
              <span style={{ background: 'linear-gradient(135deg,#00e87a 0%,#00c4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                te corresponde
              </span>
            </h1>

            <p style={{ color: '#666660', fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 420 }}>
              Identifica en 2 minutos todas las ayudas, subvenciones y prestaciones públicas a las que tienes derecho. Completamente gratis.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100, textDecoration: 'none' }}>
                {tienePerfil ? 'Ver mis ayudas →' : 'Descubrir mis ayudas →'}
              </Link>
              <Link href="/precios" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>
                Para gestorías ↗
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 40, paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
              {[{ num: `${totalAyudas}+`, lbl: 'Ayudas activas' }, { num: '2 min', lbl: 'Para completar' }, { num: '100%', lbl: 'Gratuito' }].map((s, i) => (
                <div key={i}>
                  <div className="font-display font-bold" style={{ fontSize: 26, letterSpacing: '-1px', color: C.text }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard */}
          <div style={{ position: 'relative' }} className="hidden md:block">
            <div style={{ background: '#161b27', border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)`, opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tus ayudas</span>
                <span style={{ background: C.greenDim, color: C.green, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>14 encontradas</span>
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
            </div>

            {/* Float top-right */}
            <div style={{ position: 'absolute', top: -20, right: -20, background: 'rgba(22,27,39,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 18px', textAlign: 'center', backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div className="font-display font-bold" style={{ fontSize: 32, color: C.green, letterSpacing: '-1px', lineHeight: 1 }}>14</div>
              <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>ayudas para ti</div>
            </div>

            {/* Float bottom-left */}
            <div style={{ position: 'absolute', bottom: -16, left: -16, background: 'rgba(22,27,39,0.95)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.greenDim, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>✓</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Perfil completado</div>
                <div style={{ fontSize: 10, color: C.muted }}>Resultados actualizados</div>
              </div>
            </div>
          </div>
        </section>

        </div>{/* FIN BLOQUE OSCURO */}

        {/* CÓMO FUNCIONA */}
        <section style={{ maxWidth: 1024, margin: '0 auto', background: '#F7F3EC', padding: '64px 24px', borderTop: '1px solid #E0DAD0' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: C.green, marginBottom: 12 }}>Cómo funciona</p>
          <h2 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-1.5px', color: '#111110', marginBottom: 48 }}>
            Simple, rápido y preciso
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
        </section>

        {/* FUENTES */}
        <section style={{ maxWidth: 1024, margin: '0 auto', background: '#F7F3EC', padding: '48px 24px', borderTop: '1px solid #E0DAD0' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: C.muted, marginBottom: 36 }}>
            Información extraída de fuentes oficiales
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            {FUENTES.map((f, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default', padding: '8px 14px', borderRadius: 10, border: '1px solid #E0DAD0', background: '#fff', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0DAD0'; e.currentTarget.style.boxShadow = 'none' }}>
                <div className="font-display font-bold" style={{ fontSize: 13, color: f.color }}>{f.nombre}</div>
                <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', maxWidth: 80, lineHeight: 1.3 }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* GESTORÍAS */}
        <section style={{ maxWidth: 1024, margin: '0 auto', background: '#F7F3EC', padding: '64px 24px', borderTop: '1px solid #E0DAD0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="!grid-cols-1 md:!grid-cols-2">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2D6A4F', marginBottom: 12 }}>Para gestorías y despachos</p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(28px,3vw,44px)', letterSpacing: '-1.5px', color: '#111110', marginBottom: 16, lineHeight: 1.1 }}>
                Multiplica tu cartera.<br />Sin trabajo extra.
              </h2>
              <p style={{ color: '#666660', fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 420 }}>
                Identifica automáticamente las ayudas de cada cliente. Genera el informe en segundos. Tú firmas y tramitas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                {['Hasta 10 clientes en el plan Básico (49€/mes)','Clientes ilimitados en el plan Pro (99€/mes)','Informes detallados listos para tramitar','Alertas automáticas de nuevas convocatorias'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#666660' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.greenDim, border: `1px solid rgba(0,232,122,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.green, flexShrink: 0 }}>✓</div>
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
            <div style={{ background: '#161b27', border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#2D6A4F', opacity: 0.15 }} />
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#B0AAA0', marginBottom: 20 }}>Panel de gestión</p>
              {[
                { nombre: 'García Martínez, J.', ayudas: 8, importe: '12.400€', estado: 'Pendiente' },
                { nombre: 'López Sánchez, M.', ayudas: 5, importe: '7.200€', estado: 'Tramitado' },
                { nombre: 'Fernández García, A.', ayudas: 11, importe: '18.600€', estado: 'Pendiente' },
                { nombre: 'Ruiz Pérez, C.', ayudas: 3, importe: '4.100€', estado: 'En proceso' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid #F0EAE0' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111110' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: '#888882', marginTop: 2 }}>{c.ayudas} ayudas · {c.importe}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                    background: c.estado === 'Tramitado' ? 'rgba(0,232,122,0.1)' : c.estado === 'En proceso' ? 'rgba(37,99,235,0.1)' : 'rgba(245,158,11,0.1)',
                    color: c.estado === 'Tramitado' ? C.green : c.estado === 'En proceso' ? '#60a5fa' : '#f59e0b'
                  }}>{c.estado}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ background: '#111110', border: 'none', borderRadius: 24, padding: '60px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)` }} />
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(24px,3vw,42px)', letterSpacing: '-1.5px', color: '#f0f0f5', marginBottom: 16 }}>
              ¿Cuánto dinero te estás perdiendo?
            </h2>
            <p style={{ color: 'rgba(240,240,245,0.6)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Miles de ciudadanos no solicitan las ayudas que les corresponden porque no saben que existen. Descúbrelas ahora.
            </p>
            <Link href={ctaHref} style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
              {tienePerfil ? 'Ver mis ayudas →' : 'Empezar gratis — sin tarjeta'}
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px', borderTop: '1px solid #E0DAD0', background: '#F7F3EC' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span className="font-display font-bold" style={{ color: '#111110' }}>cóbratelo<span style={{ color: '#2D6A4F' }}>.es</span></span>
            <p style={{ color: '#888882', fontSize: 12, textAlign: 'center' }}>
              Los resultados son orientativos. Consulta siempre las fuentes oficiales.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, fontSize: 12, color: C.muted }}>
              {[['Precios','/precios'],['Aviso Legal','/legal'],['Privacidad','/privacidad'],['Términos','/terminos']].map(([l,h]) => (
                <Link key={h} href={h} style={{ color: '#888882', textDecoration: 'none' }}>{l}</Link>
              ))}
              <a href="mailto:hola@cobratelo.es" style={{ color: '#888882', textDecoration: 'none' }}>hola@cobratelo.es</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
