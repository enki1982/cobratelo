import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATS_BASE = [
  { label: 'importe medio', value: '1.517€' },
  { label: 'categorías', value: '14' },
]

const HOW = [
  {
    n: '01',
    title: 'Cuéntanos tu situación',
    desc: 'Solo checkboxes. Sin formularios. 2 minutos.',
  },
  {
    n: '02',
    title: 'Analizamos tu perfil',
    desc: 'Cruzamos tu situación con todas las ayudas públicas vigentes en España.',
  },
  {
    n: '03',
    title: 'Cobra lo tuyo',
    desc: 'Recibes la lista con importes, requisitos y enlace oficial de cada ayuda.',
  },
]

export default function Home() {
  const [count, setCount] = useState(0)
  const [totalAyudas, setTotalAyudas] = useState(66)

  useEffect(() => {
    const target = 66
    const step = Math.ceil(target / 30)
    const timer = setInterval(() => {
      setCount(c => {
        if (c + step >= target) { clearInterval(timer); return target }
        return c + step
      })
    }, 40)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.from('ayudas').select('*', { count: 'exact', head: true })
      .in('estado', ['abierta', 'permanente', 'pendiente'])
      .then(({ count }) => { if (count) setTotalAyudas(count) })
  }, [])

  return (
    <>
      <Head>
        <title>Cóbratelo — Las ayudas públicas que te corresponden</title>
        <meta name="description" content="Descubre en 2 minutos qué ayudas, subvenciones y prestaciones del Estado te corresponden. Gratis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
          <span className="font-display text-2xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </span>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/precios" className="hidden sm:block text-sm text-[#555550] hover:text-[#111110] transition-colors">Precios</Link>
            <Link href="/perfil"
              className="bg-[#E8540A] text-white text-sm font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:bg-[#d14a08] transition-colors">
              <span className="hidden sm:inline">Empezar gratis</span>
              <span className="sm:hidden">Empezar</span>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 bg-[#E8F5EE] text-[#1A7A4A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse"></span>
              {totalAyudas} ayudas públicas activas en España
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6 animate-fade-up delay-100">
            Las ayudas que<br />
            <span className="italic font-light text-[#1A7A4A]">te corresponden,</span><br />
            sin buscarlas.
          </h1>

          <p className="text-lg text-[#555550] max-w-xl mb-10 animate-fade-up delay-200">
            Miles de españoles dejan de cobrar prestaciones, subvenciones y deducciones
            porque no saben que existen. En 2 minutos descubres las tuyas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
            <Link href="/perfil"
              className="bg-[#111110] text-[#F7F3EC] text-base font-semibold px-8 py-4 rounded-full hover:bg-[#333330] transition-colors inline-flex items-center gap-2">
              Descubre lo tuyo
              <span className="text-[#22C55E]">→</span>
            </Link>
            <span className="text-sm text-[#888882] self-center">Gratis · Sin registro · 2 minutos</span>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-[#E0DAD0] py-8">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 divide-x divide-[#E0DAD0]">
            {[{ label: 'ayudas activas', value: `${totalAyudas}+` }, ...STATS_BASE].map((s, i) => (
              <div key={i} className="px-6 text-center">
                <div className="font-display text-3xl font-bold text-[#1A7A4A]">{s.value}</div>
                <div className="text-xs text-[#888882] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-bold mb-12">Cómo funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW.map((h, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#E0DAD0]">
                <div className="font-display text-4xl font-bold text-[#E0DAD0] mb-4">{h.n}</div>
                <h3 className="font-semibold text-[#111110] mb-2">{h.title}</h3>
                <p className="text-sm text-[#888882] leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-[#111110] mx-6 rounded-3xl mb-16 px-8 py-14 max-w-5xl md:mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-[#F7F3EC] mb-4">
            ¿Cuánto dinero te<br />
            <span className="italic text-[#22C55E]">estás dejando?</span>
          </h2>
          <p className="text-[#888882] mb-8 max-w-md mx-auto">
            El importe medio entre nuestras ayudas es de 1.517€. Descubre las que te corresponden.
          </p>
          <Link href="/perfil"
            className="bg-[#E8540A] text-white font-semibold px-8 py-4 rounded-full inline-block hover:bg-[#d14a08] transition-colors">
            Empezar ahora — es gratis
          </Link>
        </section>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-[#E0DAD0]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <span className="font-display font-bold text-[#111110]">cobratelo.es</span>
            <p className="text-xs text-[#888882] text-center">
              Los resultados son orientativos. Consulta siempre las fuentes oficiales.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#888882]">
            <a href="/precios" className="hover:text-[#111110] transition-colors">Precios</a>
            <a href="/legal" className="hover:text-[#111110] transition-colors">Aviso Legal</a>
            <a href="/privacidad" className="hover:text-[#111110] transition-colors">Privacidad</a>
            <a href="/cookies" className="hover:text-[#111110] transition-colors">Cookies</a>
            <a href="/terminos" className="hover:text-[#111110] transition-colors">Términos</a>
            <a href="mailto:hola@cobratelo.es" className="hover:text-[#111110] transition-colors">hola@cobratelo.es</a>
          </div>
          <p className="text-xs text-[#888882] text-center mt-3">© 2026 Volta Grup</p>
        </footer>

      </div>
    </>
  )
}
