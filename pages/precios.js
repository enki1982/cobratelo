import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const PLANES_CIUDADANO = [
  {
    id: 'gratis',
    nombre: 'Gratis',
    precio: '0€',
    periodo: 'siempre',
    descripcion: 'Acceso completo a todas las ayudas públicas que te corresponden',
    features: [
      'Cuestionario de perfil completo',
      'Todas las ayudas visibles sin límite',
      'Alertas cuando abran convocatorias',
      'Enlace directo a convocatoria oficial',
      'Informe compartible con tu gestoría',
    ],
    cta: 'Empezar gratis',
    href: '/perfil',
    destacado: true,
  },
]

const PLANES_GESTORIA = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: '79€',
    periodo: 'mes',
    descripcion: 'Para despachos que quieren empezar a ofrecer ayudas públicas a sus clientes',
    features: [
      'Hasta 25 clientes activos',
      'Identificación automática de ayudas por cliente',
      'Informe detallado por cliente',
      'Alertas automáticas de nuevas convocatorias',
      'Envío de informe al cliente por email',
      'Soporte por email',
    ],
    cta: 'Empezar Básico',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    destacado: false,
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '149€',
    periodo: 'mes',
    descripcion: 'Para gestorías en crecimiento que gestionan carteras amplias',
    features: [
      'Clientes ilimitados',
      'Todo lo del plan Básico',
      'Panel de gestión multi-cliente',
      'Exportación masiva de informes',
      'Alertas personalizadas por cliente',
      'Soporte prioritario',
    ],
    cta: 'Empezar Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    destacado: true,
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: '399€',
    periodo: 'mes',
    descripcion: 'Para grandes despachos con integración completa en su flujo de trabajo',
    features: [
      'Todo lo del plan Pro',
      'Integración sede electrónica',
      'Formularios pre-rellenados listos para tramitar',
      'API acceso a datos',
      'Marca blanca',
      'Account manager dedicado',
    ],
    cta: 'Contactar',
    href: 'mailto:hola@cobratelo.es',
    destacado: false,
    badge: 'Próximamente',
  },
]

function PlanCard({ plan }) {
  const handleClick = () => {
    if (plan.href) { window.location.href = plan.href; return }
    if (plan.priceId) { window.location.href = `/api/checkout?priceId=${plan.priceId}` }
  }

  return (
    <div className={`rounded-3xl p-7 flex flex-col border-2 transition-all relative
      ${plan.destacado
        ? 'border-[#1A7A4A] bg-[#111110] text-white'
        : 'border-[#E0DAD0] bg-white text-[#111110]'
      }`}>
      {plan.destacado && (
        <span className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full w-fit mb-4">
          Más popular
        </span>
      )}
      {plan.badge && (
        <span className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full w-fit mb-4">
          {plan.badge}
        </span>
      )}
      <div className="mb-4">
        <h3 className={`font-display text-xl font-bold mb-1 ${plan.destacado ? 'text-white' : 'text-[#111110]'}`}>
          {plan.nombre}
        </h3>
        <p className="text-sm text-[#888882]">{plan.descripcion}</p>
      </div>
      <div className="mb-6">
        <span className={`font-display text-4xl font-bold ${plan.destacado ? 'text-white' : 'text-[#111110]'}`}>
          {plan.precio}
        </span>
        {plan.periodo !== 'siempre' ? (
          <span className="text-[#888882] text-sm ml-1">/{plan.periodo}</span>
        ) : (
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
      <button onClick={handleClick} disabled={!!plan.badge}
        className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all
          ${plan.badge ? 'opacity-50 cursor-not-allowed bg-[#F7F3EC] text-[#888882] border border-[#E0DAD0]'
            : plan.destacado
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
        <title>Precios — Cóbratelo.es</title>
        <meta name="description" content="Gratis para ciudadanos. Planes profesionales para gestorías desde 79€/mes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <Link href="/perfil"
            className="bg-[#111110] text-[#F7F3EC] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
            Empezar gratis
          </Link>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl font-bold text-[#111110] mb-4">
              Gratis para ciudadanos.<br />
              <span className="italic text-[#1A7A4A]">Poderoso para gestorías.</span>
            </h1>
            <p className="text-[#888882] text-lg max-w-lg mx-auto">
              Cualquier ciudadano accede gratis a todas sus ayudas. Las gestorías pagan por gestionar sus clientes de forma profesional.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-10">
            <div className="bg-white border border-[#E0DAD0] rounded-full p-1 flex gap-1">
              <button onClick={() => setTab('ciudadano')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${tab === 'ciudadano' ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                Para ciudadanos
              </button>
              <button onClick={() => setTab('gestoria')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${tab === 'gestoria' ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                Para gestorías
              </button>
            </div>
          </div>

          {/* Planes ciudadano */}
          {tab === 'ciudadano' && (
            <div className="max-w-md mx-auto">
              <PlanCard plan={PLANES_CIUDADANO[0]} />
              <p className="text-center text-sm text-[#888882] mt-4">
                Sin tarjeta. Sin letra pequeña. Sin límite de ayudas.
              </p>
            </div>
          )}

          {/* Planes gestoría */}
          {tab === 'gestoria' && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {PLANES_GESTORIA.map(plan => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
              <p className="text-center text-sm text-[#888882] mt-6">
                Todos los planes incluyen 14 días de prueba gratuita. Sin permanencia.
              </p>
            </>
          )}

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#111110] mb-6 text-center">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                { q: '¿De verdad es gratis para ciudadanos?', a: 'Sí, completamente. Accedes a todas las ayudas, alertas y el informe para tu gestoría sin pagar nada.' },
                { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia ni penalizaciones. Cancelas desde tu cuenta en cualquier momento.' },
                { q: '¿Qué diferencia hay entre Básico y Pro?', a: 'El plan Básico tiene un límite de 25 clientes activos. El Pro no tiene límite y añade panel multi-cliente y exportación masiva.' },
                { q: '¿Cuándo estará disponible el plan Enterprise?', a: 'La integración con sede electrónica y formularios pre-rellenados está en desarrollo. Puedes apuntarte a la lista de espera escribiendo a hola@cobratelo.es' },
                { q: '¿Los datos de mis clientes son seguros?', a: 'Sí. No vendemos ni compartimos datos con terceros. Cumplimos con el RGPD y la normativa española de protección de datos.' },
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
