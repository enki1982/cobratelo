import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const PLANES_CIUDADANO = [
  {
    id: 'gratis',
    nombre: 'Gratis',
    precio: '0€',
    periodo: 'siempre',
    descripcion: 'Descubre todas las ayudas que te corresponden',
    features: [
      'Cuestionario de perfil completo',
      'Todas las ayudas visibles',
      'Enlace a convocatoria oficial',
      'Una consulta sin límite',
    ],
    cta: 'Empezar gratis',
    href: '/perfil',
    destacado: false,
  },
  {
    id: 'alertas',
    nombre: 'Alertas',
    precio: '0,99€',
    periodo: 'mes',
    descripcion: 'Te avisamos cuando abra una ayuda que te aplica',
    features: [
      'Todo lo del plan Gratis',
      'Alertas semanales personalizadas',
      'Notificación cuando abren convocatorias',
      'Informe PDF descargable',
      'Envío directo a tu gestoría',
    ],
    cta: 'Activar alertas',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ALERTAS,
    destacado: true,
  },
]

const PLANES_GESTORIA = [
  {
    id: 'starter',
    nombre: 'Starter',
    precio: '49€',
    periodo: 'mes',
    descripcion: 'Para gestorías pequeñas',
    features: [
      'Hasta 25 clientes',
      'Consultas ilimitadas',
      'Informes PDF por cliente',
      'Alertas automáticas',
      'Soporte por email',
    ],
    cta: 'Empezar Starter',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    destacado: false,
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '99€',
    periodo: 'mes',
    descripcion: 'Para gestorías en crecimiento',
    features: [
      'Clientes ilimitados',
      'Panel de gestión multi-cliente',
      'Alertas automáticas por cliente',
      'Exportación masiva de informes',
      'Soporte prioritario',
    ],
    cta: 'Empezar Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    destacado: true,
  },
  {
    id: 'agencia',
    nombre: 'Agencia',
    precio: '199€',
    periodo: 'mes',
    descripcion: 'Para grandes despachos',
    features: [
      'Todo lo del plan Pro',
      'Multi-sede y sub-cuentas',
      'Acceso API',
      'Marca blanca',
      'Account manager dedicado',
    ],
    cta: 'Contactar',
    href: 'mailto:hola@cobratelo.es',
    destacado: false,
  },
]

function PlanCard({ plan, tipo }) {
  const handleClick = () => {
    if (plan.href) {
      window.location.href = plan.href
      return
    }
    if (plan.priceId) {
      window.location.href = `/api/checkout?priceId=${plan.priceId}`
    }
  }

  return (
    <div className={`rounded-3xl p-7 flex flex-col border-2 transition-all
      ${plan.destacado
        ? 'border-[#1A7A4A] bg-[#111110] text-white'
        : 'border-[#E0DAD0] bg-white text-[#111110]'
      }`}>
      {plan.destacado && (
        <span className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full w-fit mb-4">
          Más popular
        </span>
      )}
      <div className="mb-4">
        <h3 className={`font-display text-xl font-bold mb-1 ${plan.destacado ? 'text-white' : 'text-[#111110]'}`}>
          {plan.nombre}
        </h3>
        <p className={`text-sm ${plan.destacado ? 'text-[#888882]' : 'text-[#888882]'}`}>
          {plan.descripcion}
        </p>
      </div>
      <div className="mb-6">
        <span className={`font-display text-4xl font-bold ${plan.destacado ? 'text-white' : 'text-[#111110]'}`}>
          {plan.precio}
        </span>
        {plan.periodo !== 'siempre' && (
          <span className="text-[#888882] text-sm ml-1">/{plan.periodo}</span>
        )}
        {plan.periodo === 'siempre' && (
          <span className="text-[#888882] text-sm ml-1">para siempre</span>
        )}
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="text-[#22C55E] mt-0.5 shrink-0">✓</span>
            <span className={plan.destacado ? 'text-[#C0C0C0]' : 'text-[#555550]'}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleClick}
        className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all
          ${plan.destacado
            ? 'bg-[#E8540A] text-white hover:bg-[#d14a08]'
            : 'bg-[#F7F3EC] text-[#111110] border border-[#E0DAD0] hover:bg-[#EEEAE0]'
          }`}>
        {plan.cta}
      </button>
    </div>
  )
}

export default function Precios() {
  const [tab, setTab] = useState('ciudadano')

  return (
    <>
      <Head>
        <title>Precios — Cóbratelo</title>
        <meta name="description" content="Planes para ciudadanos y gestorías. Desde 0,99€/mes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <Link href="/perfil"
            className="bg-[#111110] text-[#F7F3EC] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
            Empezar gratis
          </Link>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl font-bold text-[#111110] mb-4">
              Precios simples y<br />
              <span className="italic text-[#1A7A4A]">sin sorpresas</span>
            </h1>
            <p className="text-[#888882] text-lg max-w-md mx-auto">
              Empieza gratis. Paga solo si quieres que trabajemos para ti cada semana.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-10">
            <div className="bg-white border border-[#E0DAD0] rounded-full p-1 flex gap-1">
              <button
                onClick={() => setTab('ciudadano')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${tab === 'ciudadano' ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                Para ciudadanos
              </button>
              <button
                onClick={() => setTab('gestoria')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${tab === 'gestoria' ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                Para gestorías
              </button>
            </div>
          </div>

          {/* Planes ciudadano */}
          {tab === 'ciudadano' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {PLANES_CIUDADANO.map(plan => (
                <PlanCard key={plan.id} plan={plan} tipo="ciudadano" />
              ))}
            </div>
          )}

          {/* Planes gestoría */}
          {tab === 'gestoria' && (
            <div className="grid md:grid-cols-3 gap-6">
              {PLANES_GESTORIA.map(plan => (
                <PlanCard key={plan.id} plan={plan} tipo="gestoria" />
              ))}
            </div>
          )}

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#111110] mb-6 text-center">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia ni penalizaciones. Cancelas desde tu cuenta en cualquier momento.' },
                { q: '¿Qué incluye exactamente la alerta semanal?', a: 'Cada lunes revisamos las convocatorias activas y te enviamos un email con las novedades que aplican a tu perfil.' },
                { q: '¿Las gestorías pueden gestionar varios clientes?', a: 'Sí. Con el plan Starter hasta 25 clientes, con Pro sin límite. Cada cliente tiene su propio perfil y alertas.' },
                { q: '¿Los datos son seguros?', a: 'Sí. No vendemos ni compartimos tus datos. Solo se usan para calcular qué ayudas te corresponden.' },
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-[#E0DAD0]">
                  <p className="font-semibold text-[#111110] text-sm mb-1">{faq.q}</p>
                  <p className="text-sm text-[#888882]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
