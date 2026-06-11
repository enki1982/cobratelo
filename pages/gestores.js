import Head from 'next/head'
import Link from 'next/link'

const C = {
  bg: '#1a1200',
  card: '#241800',
  border: 'rgba(255,180,60,0.12)',
  orange: '#FF8300',
  orangeLight: 'rgba(255,131,0,0.12)',
  text: '#FFF5EB',
  muted: 'rgba(255,245,235,0.55)',
  light: 'rgba(255,245,235,0.3)',
}

function Check() {
  return <span style={{ color: C.orange, marginRight: 8, fontWeight: 700 }}>✓</span>
}

const PASOS = [
  { n: '01', titulo: 'Ciudadano se registra gratis', desc: 'Rellena un cuestionario de 2 minutos con su situación laboral, ingresos, familia y municipio.' },
  { n: '02', titulo: 'El sistema detecta sus ayudas', desc: 'Cruzamos más de 11.000 convocatorias activas (estatales, autonómicas y locales) y le mostramos las que le corresponden.' },
  { n: '03', titulo: 'Te lo envía a ti', desc: 'Si quiere ayuda para tramitarlas, te autoriza con un consentimiento RGPD y te llega todo: perfil, ayudas y datos de contacto.' },
  { n: '04', titulo: 'Tú gestionas desde tu panel', desc: 'Expediente abierto, Kanban, tareas, documentos, alertas de vencimiento y honorarios. Todo en un sitio.' },
]

const PROBLEMAS = [
  'Tus clientes no te preguntan por ayudas porque no saben que existen.',
  'Cuando te preguntan, el proceso de identificación es manual y lento.',
  'Las convocatorias cambian y es difícil estar al día para todos los clientes.',
  'Los ciudadanos que necesitan gestor no saben cómo encontrarte.',
]

const PLANES = [
  {
    nombre: 'Básico',
    precio: '149€',
    desc: 'Para despachos de hasta 50 clientes',
    features: ['Hasta 50 clientes activos', 'Panel de expedientes y Kanban', 'Informe detallado por cliente', 'Alertas de nuevas convocatorias', 'Soporte por email'],
    cta: 'Empezar Básico',
    href: '/precios',
    destacado: false,
  },
  {
    nombre: 'Pro',
    precio: '399€',
    desc: 'Para gestorías sin límite de clientes',
    features: ['Clientes ilimitados', 'Expedientes y Kanban sin límite', 'Exportación masiva de informes', 'Alertas personalizadas por cliente', 'Histórico completo de actividad', 'Soporte prioritario'],
    cta: 'Empezar Pro',
    href: '/precios',
    destacado: true,
  },
]

export default function Gestores() {
  return (
    <>
      <Head>
        <title>Cóbratelo.es para Gestorías — Nuevo canal de clientes + CRM de ayudas</title>
        <meta name="description" content="Tu gestoría recibe clientes que ya saben las ayudas que les corresponden. Tú solo tienes que tramitarlas. Panel CRM incluido." />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Cóbratelo.es para Gestorías" />
        <meta property="og:description" content="Nuevo canal de clientes. El ciudadano llega ya sabiendo sus ayudas. Tú tramitas." />
        <meta property="og:url" content="https://cobratelo.es/gestores" />
        <meta property="og:image" content="https://www.cobratelo.es/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cóbratelo.es para Gestorías" />
        <meta name="twitter:description" content="Convierte ayudas públicas en nuevos clientes. El ciudadano llega ya sabiendo sus ayudas — tú solo tienes que tramitarlas." />
        <meta name="twitter:image" content="https://www.cobratelo.es/og-image.png" />
        <link rel="canonical" href="https://www.cobratelo.es/gestores" />
      </Head>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Inter', sans-serif" }}>

        {/* NAV */}
        <nav style={{ padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 100 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: C.text, textDecoration: 'none' }}>
            cóbratelo<span style={{ color: C.orange }}>.es</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/precios" style={{ color: C.muted, textDecoration: 'none', fontSize: 14 }}>Precios</Link>
            <Link href="/gestor/expedientes" style={{ background: C.orange, color: '#fff', textDecoration: 'none', padding: '8px 18px', borderRadius: 99, fontWeight: 600, fontSize: 14 }}>Entrar</Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: C.orangeLight, color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', padding: '6px 16px', borderRadius: 99, marginBottom: 24, textTransform: 'uppercase' }}>
            Para gestorías y asesores
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Tu próximo cliente ya sabe<br />las ayudas que le corresponden
          </h1>
          <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Convierte ayudas públicas en nuevos clientes para tu despacho.
            El ciudadano llega ya sabiendo sus ayudas — tú solo tienes que tramitarlas.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/gestor/expedientes" style={{ background: C.orange, color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 99, fontWeight: 700, fontSize: 16 }}>
              Probar gratis 14 días
            </Link>
            <Link href="/precios" style={{ color: C.muted, textDecoration: 'none', padding: '14px 24px', borderRadius: 99, fontWeight: 600, fontSize: 15, border: `1px solid ${C.border}` }}>
              Ver planes y precios
            </Link>
          </div>
          <p style={{ fontSize: 12, color: C.light, marginTop: 14 }}>Sin tarjeta de crédito. Sin permanencia.</p>
        </section>

        {/* NÚMEROS */}
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              { n: '+11.000', l: 'convocatorias activas' },
              { n: 'España', l: 'estatal, autonómica y local' },
              { n: '2 min', l: 'para que un ciudadano vea sus ayudas' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px 24px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: C.orange, margin: '0 0 4px' }}>{s.n}</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EL PROBLEMA */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>El problema que resolvemos juntos</h2>
          <p style={{ color: C.muted, marginBottom: 32, fontSize: 15 }}>El 80% de los ciudadanos no tramita las ayudas a las que tiene derecho. No porque no quieran, sino porque no saben que existen.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PROBLEMAS.map((p, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: C.orange, fontSize: 18, marginTop: 1, flexShrink: 0 }}>→</span>
                <p style={{ margin: 0, fontSize: 15, color: C.muted, lineHeight: 1.6 }}>{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Cómo llegan los clientes a tu panel</h2>
            <p style={{ color: C.muted, textAlign: 'center', marginBottom: 48, fontSize: 15 }}>Sin llamadas en frío. Sin publicidad. El ciudadano llega cuando ya tiene interés.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {PASOS.map(p => (
                <div key={p.n} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px', background: C.bg }}>
                  <div style={{ color: C.orange, fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', marginBottom: 12 }}>{p.n}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>{p.titulo}</h3>
                  <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUÉ INCLUYE EL PANEL */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tu panel profesional incluido</h2>
          <p style={{ color: C.muted, marginBottom: 36, fontSize: 15 }}>No es un simple listado. Es un CRM completo para gestionar expedientes de ayudas.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { t: 'Bandeja de nuevos clientes', d: 'Ves los ciudadanos que te han autorizado acceso, con su perfil y ayudas identificadas.' },
              { t: 'Kanban de expedientes', d: 'Arrastra los expedientes entre estados: nuevo, en tramitación, presentada, concedida.' },
              { t: 'Ficha completa', d: 'Resumen del caso, actividad, tareas, documentos y honorarios en una sola pantalla.' },
              { t: 'Alertas de plazos', d: 'Recibe un email los lunes con los expedientes que vencen esa semana.' },
              { t: 'Consentimiento RGPD', d: 'Cada cliente autoriza expresamente la cesión de sus datos. Todo trazable y auditado.' },
              { t: 'Segregación total', d: 'Los datos de tus clientes son solo tuyos. Ninguna otra gestoría puede verlos.' },
            ].map((f, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>{f.t}</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRECIOS */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Precios sin sorpresas</h2>
            <p style={{ color: C.muted, textAlign: 'center', marginBottom: 40, fontSize: 15 }}>Prueba 14 días gratis. Sin tarjeta. Cancela cuando quieras.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {PLANES.map(plan => (
                <div key={plan.nombre} style={{ border: `1px solid ${plan.destacado ? C.orange : C.border}`, borderRadius: 20, padding: '28px 24px', background: plan.destacado ? 'rgba(255,131,0,0.06)' : C.bg, position: 'relative' }}>
                  {plan.destacado && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.orange, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>MÁS POPULAR</div>}
                  <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>{plan.nombre}</p>
                  <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>{plan.desc}</p>
                  <p style={{ fontSize: 36, fontWeight: 800, margin: '0 0 4px', color: plan.destacado ? C.orange : C.text }}>{plan.precio}<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/mes</span></p>
                  <p style={{ fontSize: 12, color: C.light, margin: '0 0 24px' }}>+ IVA. Sin permanencia.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {plan.features.map((f, i) => <div key={i} style={{ fontSize: 13, color: C.muted }}><Check />{f}</div>)}
                  </div>
                  <Link href={plan.href} style={{ display: 'block', textAlign: 'center', background: plan.destacado ? C.orange : 'transparent', color: plan.destacado ? '#fff' : C.orange, textDecoration: 'none', padding: '11px 0', borderRadius: 99, fontWeight: 700, fontSize: 14, border: `1px solid ${C.orange}` }}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARA COLEGIOS */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '36px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.orange, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Colegios profesionales y asociaciones</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>¿Representas a un colectivo de gestores?</h2>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Ofrecemos condiciones especiales para colegiados y podemos hacer una demostración para los miembros de tu organización.
            </p>
            <a href="mailto:hola@cobratelo.es?subject=Acuerdo%20para%20colegiados%20%E2%80%94%20C%C3%B3bratelo.es" style={{ background: C.orange, color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 99, fontWeight: 700, fontSize: 15, display: 'inline-block' }}>
              Contactar para acuerdo
            </a>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ borderTop: `1px solid ${C.border}`, padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Empieza gratis hoy</h2>
          <p style={{ color: C.muted, fontSize: 16, margin: '0 0 36px' }}>14 días de prueba. Sin tarjeta. Sin compromiso.</p>
          <Link href="/gestor/expedientes" style={{ background: C.orange, color: '#fff', textDecoration: 'none', padding: '16px 40px', borderRadius: 99, fontWeight: 700, fontSize: 17 }}>
            Crear cuenta gratis →
          </Link>
          <p style={{ color: C.light, fontSize: 13, marginTop: 16 }}>
            ¿Tienes dudas? Escríbenos a <a href="mailto:hola@cobratelo.es" style={{ color: C.muted }}>hola@cobratelo.es</a>
          </p>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center' }}>
          <p style={{ color: C.light, fontSize: 12, margin: 0 }}>
            © 2026 Cóbratelo.es · <Link href="/privacidad" style={{ color: C.light }}>Privacidad</Link> · <Link href="/terminos" style={{ color: C.light }}>Términos</Link>
          </p>
        </footer>

      </div>
    </>
  )
}
