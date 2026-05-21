import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [tienePerfil, setTienePerfil] = useState(false)
  const [perfilGuardado, setPerfilGuardado] = useState(null)
  const [totalAyudas, setTotalAyudas] = useState(66)
  const [mostrarBotonAyudas, setMostrarBotonAyudas] = useState(false)

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
  const ctaLabel = tienePerfil ? 'Ver mis ayudas →' : 'Descubrir mis ayudas →'

  return (
    <>
      <Head>
        <title>Cóbratelo.es — Las ayudas públicas que te corresponden</title>
        <meta name="description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        .cobratelo-dark {
          --green: #00e87a;
          --green-dim: rgba(0,232,122,0.10);
          --green-glow: rgba(0,232,122,0.25);
          --border: rgba(255,255,255,0.08);
          --muted: rgba(240,240,245,0.5);
          --surface: #0f0f1a;
        }
        .syne { font-family: 'Syne', sans-serif; }
        @keyframes cobr-pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.5;transform:scale(.8)}
        }
        @keyframes cobr-float {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-8px)}
        }
        .float-anim { animation: cobr-float 4s ease-in-out infinite; }
        .float-anim-2 { animation: cobr-float 4s ease-in-out infinite 2s; }
      `}</style>

      <div className="cobratelo-dark min-h-screen" style={{
        background: '#09090f',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% 0%, rgba(0,232,122,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(124,58,237,0.09) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 50% 80%, rgba(37,99,235,0.07) 0%, transparent 50%)
        `,
        color: '#f0f0f5',
      }}>

        {/* Nav */}
        <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', background: 'rgba(9,9,15,0.8)' }}
          className="sticky top-0 z-50 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="syne text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: 'var(--green)' }}>.es</span>
            </span>
            <div className="flex items-center gap-3 md:gap-5">
              <Link href="/precios" className="hidden sm:block text-sm" style={{ color: 'var(--muted)' }}>Precios</Link>
              <Link href="/cuenta" className="text-sm" style={{ color: 'var(--muted)' }}>Mi cuenta</Link>
              <Link href={ctaHref}
                className="text-sm font-bold px-5 py-2.5 rounded-full transition-all"
                style={{ background: 'var(--green)', color: '#000', letterSpacing: '-0.2px' }}>
                {tienePerfil ? 'Mis ayudas' : 'Empezar gratis'}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,232,122,0.25)', color: 'var(--green)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'cobr-pulse 2s infinite' }} />
              {totalAyudas}+ convocatorias activas en España
            </div>

            <h1 className="syne font-bold mb-5" style={{ fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1.05, letterSpacing: '-2px' }}>
              Cobra todo lo que<br />
              <span style={{ background: 'linear-gradient(135deg, var(--green) 0%, #00c4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                te corresponde
              </span>
            </h1>

            <p className="text-base mb-8 leading-relaxed" style={{ color: 'var(--muted)', maxWidth: 420 }}>
              Identifica en 2 minutos todas las ayudas, subvenciones y prestaciones públicas a las que tienes derecho. Completamente gratis.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link href={ctaHref}
                className="font-bold text-base px-7 py-4 rounded-full transition-all"
                style={{ background: 'var(--green)', color: '#000', boxShadow: '0 0 0 0 var(--green-glow)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px var(--green-glow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {ctaLabel}
              </Link>
              <Link href="/precios" className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                Para gestorías ↗
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { num: `${totalAyudas}+`, lbl: 'Ayudas activas' },
                { num: '2 min', lbl: 'Para completar' },
                { num: '100%', lbl: 'Gratuito' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="syne font-bold text-2xl" style={{ letterSpacing: '-1px', color: '#f0f0f5' }}>{s.num}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard visual */}
          <div className="relative hidden md:block">
            <div className="rounded-2xl p-6 relative overflow-hidden float-anim"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* top glow line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--green),transparent)', opacity: 0.6 }} />

              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tus ayudas</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  {totalAyudas > 10 ? '14 encontradas' : `${totalAyudas} encontradas`}
                </span>
              </div>

              {[
                { icon: '🏠', nombre: 'Bono Alquiler Joven 2026', org: 'Ministerio de Vivienda', importe: '2.400€', c: 'rgba(0,232,122,0.12)' },
                { icon: '💼', nombre: 'Cupons ACCIÓ Digitalització', org: 'Generalitat de Catalunya', importe: '3.000€', c: 'rgba(37,99,235,0.12)' },
                { icon: '⚡', nombre: 'Kit Digital — Presencia web', org: 'Red.es · Gobierno de España', importe: '2.000€', c: 'rgba(124,58,237,0.12)' },
                { icon: '📋', nombre: 'Prestació desocupació', org: 'SEPE', importe: '1.200€/mes', c: 'rgba(245,158,11,0.12)' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5" style={{ borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: a.c }}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#f0f0f5' }}>{a.nombre}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{a.org}</div>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ color: 'var(--green)' }}>{a.importe}</div>
                </div>
              ))}
            </div>

            {/* Float cards */}
            <div className="absolute -top-5 -right-5 rounded-2xl px-5 py-4 text-center float-anim-2"
              style={{ background: 'rgba(15,15,26,0.95)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div className="syne font-bold text-3xl" style={{ color: 'var(--green)', letterSpacing: '-1px' }}>14</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>ayudas para ti</div>
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(15,15,26,0.95)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>✓</div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#f0f0f5' }}>Perfil completado</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Resultados actualizados</div>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="max-w-5xl mx-auto px-6 py-16" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--green)' }}>Cómo funciona</p>
          <h2 className="syne font-bold text-center mb-12" style={{ fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-1.5px', color: '#f0f0f5' }}>
            Simple, rápido y preciso
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '01', icon: '🎯', title: 'Cuéntanos tu situación', desc: 'Solo checkboxes. Sin formularios. 2 minutos para completar tu perfil.' },
              { n: '02', icon: '🔍', title: 'Analizamos tu perfil', desc: 'Cruzamos tu situación con todas las ayudas públicas vigentes en España.' },
              { n: '03', icon: '💰', title: 'Cobra lo tuyo', desc: 'Lista con importes, requisitos y enlace oficial de cada ayuda. Lista para tramitar.' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,232,122,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="text-2xl mb-4">{s.icon}</div>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--green)' }}>{s.n}</div>
                <div className="syne font-bold text-base mb-2" style={{ color: '#f0f0f5', letterSpacing: '-0.3px' }}>{s.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fuentes oficiales */}
        <section className="max-w-5xl mx-auto px-6 py-12" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-10" style={{ color: 'var(--muted)' }}>
            Información extraída de fuentes oficiales
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { nombre: 'A.E.A.T.', sub: 'Agencia Tributaria', color: '#4a9eff' },
              { nombre: 'SEPE', sub: 'Servicio Público Empleo', color: '#4a9eff' },
              { nombre: 'Seg. Social', sub: 'Ministerio de Inclusión', color: '#4a9eff' },
              { nombre: 'Red.es', sub: 'Ministerio Digital', color: '#ff6b6b' },
              { nombre: 'MIVAU', sub: 'Ministerio de Vivienda', color: '#4a9eff' },
              { nombre: 'Generalitat', sub: 'Catalunya', color: '#ff6b6b' },
              { nombre: 'C. Madrid', sub: 'Comunidad de Madrid', color: '#ff6b6b' },
              { nombre: 'IMSERSO', sub: 'Mayores y dependencia', color: '#4a9eff' },
              { nombre: 'ACCIÓ', sub: 'Competitivitat Empresa', color: '#ff6b6b' },
              { nombre: 'Red SARA', sub: 'Administración digital', color: '#4a9eff' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 transition-opacity duration-300 cursor-default"
                style={{ opacity: 0.35 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.35'}>
                <div className="syne font-bold text-sm" style={{ color: f.color }}>{f.nombre}</div>
                <div className="text-center leading-tight" style={{ fontSize: 10, color: 'var(--muted)', maxWidth: 90 }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,232,122,0.08) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(0,232,122,0.2)' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(90deg,transparent,var(--green),transparent)' }} />
            <h2 className="syne font-bold mb-4" style={{ fontSize: 'clamp(26px,3vw,44px)', letterSpacing: '-1.5px', color: '#f0f0f5' }}>
              ¿Cuánto dinero te estás perdiendo?
            </h2>
            <p className="text-base mb-8 mx-auto" style={{ color: 'var(--muted)', maxWidth: 480 }}>
              Miles de ciudadanos no solicitan las ayudas que les corresponden simplemente porque no saben que existen. Descúbrelas en 2 minutos.
            </p>
            <Link href={ctaHref}
              className="inline-block font-bold text-base px-8 py-4 rounded-full transition-all"
              style={{ background: 'var(--green)', color: '#000' }}>
              {ctaLabel} — sin tarjeta
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto px-6 py-8" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <span className="syne font-bold" style={{ color: '#f0f0f5' }}>cóbratelo.es</span>
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Los resultados son orientativos. Consulta siempre las fuentes oficiales.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
            <Link href="/precios" className="hover:text-white transition-colors">Precios</Link>
            <Link href="/legal" className="hover:text-white transition-colors">Aviso Legal</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <a href="mailto:hola@cobratelo.es" className="hover:text-white transition-colors">hola@cobratelo.es</a>
          </div>
        </footer>
      </div>
    </>
  )
}
