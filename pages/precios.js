import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { C, bgMesh, navStyle } from '../lib/theme'

const PLANES_CIUDADANO = [{
  id: 'gratis', nombre: 'Gratis', precio: '0€', periodo: 'siempre',
  desc: 'Acceso completo a todas las ayudas públicas que te corresponden',
  features: ['Cuestionario de perfil completo','Todas las ayudas sin límite','Alertas de nuevas convocatorias','Enlace a convocatoria oficial','Informe compartible con gestoría'],
  cta: 'Empezar gratis', href: '/perfil', destacado: true,
}]

const PLANES_GESTORIA = [
  {
    id: 'basico', nombre: 'Básico', precio: '149€', periodo: 'mes',
    desc: 'Para despachos que gestionan hasta 50 clientes',
    features: ['Hasta 50 clientes activos','Identificación automática por cliente','Informe detallado por cliente','Alertas de nuevas convocatorias','Soporte por email'],
    cta: 'Empezar Básico', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER, destacado: false,
  },
  {
    id: 'pro', nombre: 'Pro', precio: '399€', periodo: 'mes',
    desc: 'Para gestorías medianas y grandes sin límite de clientes',
    features: ['Clientes ilimitados','Todo lo del plan Básico','Panel multi-cliente','Exportación masiva de informes','Alertas personalizadas por cliente','Soporte prioritario'],
    cta: 'Empezar Pro', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO, destacado: true,
  },
  {
    id: 'enterprise', nombre: 'Enterprise', precio: '799€', periodo: 'mes',
    desc: 'Para grandes despachos con integración completa',
    features: ['Todo lo del plan Pro','Integración sede electrónica','Formularios pre-rellenados','API acceso a datos','Marca blanca','Account manager'],
    cta: 'Contactar', href: 'mailto:hola@cobratelo.es', destacado: false, badge: 'Próximamente',
  },
]

const FAQ = [
  { q: '¿De verdad es gratis para ciudadanos?', a: 'Sí, completamente. Accedes a todas las ayudas, alertas y el informe para tu gestoría sin pagar nada.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia ni penalizaciones. Cancelas desde tu cuenta en cualquier momento.' },
  { q: '¿Qué diferencia hay entre Básico y Pro?', a: 'El plan Básico tiene límite de 10 clientes activos. El Pro es ilimitado y añade panel multi-cliente y exportación masiva.' },
  { q: '¿Cuándo estará disponible Enterprise?', a: 'La integración con sede electrónica está en desarrollo. Escríbenos a hola@cobratelo.es para la lista de espera.' },
  { q: '¿Los datos de mis clientes son seguros?', a: 'Sí. No vendemos datos a terceros. Cumplimos RGPD y normativa española de protección de datos.' },
]

function PlanCard({ plan }) {
  const handleClick = () => {
    if (plan.href) { window.location.href = plan.href; return }
    if (plan.priceId) window.location.href = `/api/checkout?priceId=${plan.priceId}`
  }
  return (
    <div style={{
      background: plan.destacado ? 'rgba(255,131,0,0.06)' : C.surface,
      border: `2px solid ${plan.destacado ? 'rgba(255,131,0,0.4)' : C.border}`,
      borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {plan.destacado && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${C.green},transparent)` }} />}
      {plan.badge && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, width: 'fit-content', marginBottom: 12 }}>{plan.badge}</span>}
      {plan.destacado && <span style={{ background: C.greenDim, color: C.green, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, width: 'fit-content', marginBottom: 12 }}>Más popular</span>}
      <h3 className="font-display font-bold" style={{ fontSize: 20, color: C.text, marginBottom: 4, letterSpacing: '-0.5px' }}>{plan.nombre}</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{plan.desc}</p>
      <div style={{ marginBottom: 24 }}>
        <span className="font-display font-bold" style={{ fontSize: 40, color: C.text, letterSpacing: '-2px' }}>{plan.precio}</span>
        <span style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>/{plan.periodo}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.muted }}>
            <span style={{ color: C.green, marginTop: 1, flexShrink: 0 }}></span>{f}
          </li>
        ))}
      </ul>
      <button onClick={handleClick} disabled={!!plan.badge}
        style={{ background: plan.destacado ? C.green : 'rgba(255,255,255,0.08)', color: plan.destacado ? '#000' : C.text, fontWeight: 700, fontSize: 14, padding: '13px 0', borderRadius: 100, border: `1px solid ${plan.badge ? C.border : 'transparent'}`, cursor: plan.badge ? 'not-allowed' : 'pointer', opacity: plan.badge ? 0.5 : 1, width: '100%' }}>
        {plan.cta}
      </button>
    </div>
  )
}

export default function Precios() {
  const [tab, setTab] = useState('ciudadano')
  return (
    <>
      <Head><title>Precios — Cóbratelo.es</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div style={bgMesh}>
        <nav style={navStyle}>
          <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <Link href="/" className="font-display font-bold text-xl" style={{ color: C.text, textDecoration: 'none', letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: C.green }}>.es</span>
            </Link>
            <Link href="/perfil" style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 100, textDecoration: 'none' }}>Empezar gratis</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px 80px' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: C.green, marginBottom: 12 }}>Precios</p>
          <h1 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 'clamp(32px,5vw,56px)', letterSpacing: '-2px', color: C.text, marginBottom: 14 }}>
            Gratis para ciudadanos.<br />
            <span style={{ color: '#FF8300' }}>
              Poderoso para gestorías.
            </span>
          </h1>
          <p style={{ textAlign: 'center', color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto 48px' }}>
            Cualquier ciudadano accede gratis. Las gestorías pagan por gestionar sus clientes de forma profesional.
          </p>

          {/* Tab */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 100, padding: 4, display: 'flex', gap: 4 }}>
              {[['ciudadano','Para ciudadanos'],['gestoria','Para gestorías']].map(([id,lbl]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === id ? C.green : 'transparent', color: tab === id ? '#000' : C.muted, transition: 'all 0.2s' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {tab === 'ciudadano' && (
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <PlanCard plan={PLANES_CIUDADANO[0]} />
              <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 16 }}>Sin tarjeta. Sin letra pequeña. Sin límite de ayudas.</p>
            </div>
          )}

          {tab === 'gestoria' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="!grid-cols-1 md:!grid-cols-3">
                {PLANES_GESTORIA.map(p => <PlanCard key={p.id} plan={p} />)}
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 20 }}>14 días de prueba gratuita. Sin permanencia.</p>
            </>
          )}

          {/* FAQ */}
          <div style={{ maxWidth: 640, margin: '64px auto 0' }}>
            <h2 className="font-display font-bold" style={{ textAlign: 'center', fontSize: 28, letterSpacing: '-1px', color: C.text, marginBottom: 28 }}>Preguntas frecuentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQ.map((f, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
                  <p style={{ fontWeight: 600, color: C.text, fontSize: 14, marginBottom: 4 }}>{f.q}</p>
                  <p style={{ color: C.muted, fontSize: 13 }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer style={{ maxWidth: 1024, margin: '0 auto', padding: '24px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <p style={{ color: C.muted, fontSize: 12 }}>Cóbratelo.es · Miquel Nogueras Camero</p>
        </footer>
      </div>
    </>
  )
}
