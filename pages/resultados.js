import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const TIPO_LABEL = {
  prestacion: 'Prestación',
  subvencion: 'Subvención',
  deduccion: 'Deducción',
  servicio: 'Servicio',
  bonificacion: 'Bonificación',
  prestamo: 'Préstamo',
}

const TIPO_COLOR = {
  prestacion: 'bg-blue-50 text-blue-700',
  subvencion: 'bg-green-50 text-green-700',
  deduccion: 'bg-purple-50 text-purple-700',
  servicio: 'bg-yellow-50 text-yellow-700',
  bonificacion: 'bg-orange-50 text-orange-700',
  prestamo: 'bg-gray-50 text-gray-700',
}

function formatImporte(min, max, desc) {
  if (max > 0) {
    if (min === max) return `${min.toLocaleString('es-ES')}€`
    if (min > 0) return `${min.toLocaleString('es-ES')}€ – ${max.toLocaleString('es-ES')}€`
    return `Hasta ${max.toLocaleString('es-ES')}€`
  }
  if (desc) return desc
  return 'Variable'
}

export default function Resultados() {
  const router = useRouter()
  const [ayudas, setAyudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const FREE_LIMIT = 3

  useEffect(() => {
    if (!router.isReady) return
    fetchAyudas()
  }, [router.isReady])

  const fetchAyudas = async () => {
    try {
      const { data, error } = await supabase
        .from('ayudas')
        .select('*')
        .in('estado', ['abierta', 'permanente', 'pendiente'])
        .order('importe_max', { ascending: false })
        .limit(20)

      if (error) throw error

      setAyudas(data || [])
      const sum = (data || []).reduce((acc, a) => acc + (a.importe_max || 0), 0)
      setTotal(sum)

      // Animación contador
      let count = 0
      const step = Math.ceil(sum / 40)
      const timer = setInterval(() => {
        count += step
        if (count >= sum) { clearInterval(timer); setDisplayCount(sum); return }
        setDisplayCount(count)
      }, 40)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-display text-xl text-[#111110]">Analizando tu perfil...</p>
          <p className="text-sm text-[#888882] mt-2">Cruzando con {42} ayudas activas</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Tus ayudas — Cobratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">

        {/* Nav */}
        <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <Link href="/perfil" className="text-sm text-[#888882] hover:text-[#111110] transition-colors">
            ← Volver al perfil
          </Link>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pb-20">

          {/* Header resultados */}
          <div className="bg-[#111110] rounded-3xl p-8 mb-8 animate-fade-up">
            <p className="text-[#888882] text-sm mb-2">Ayudas potenciales encontradas</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-[#22C55E]">
                {ayudas.length}
              </span>
              <span className="text-[#888882] mb-2">ayudas activas</span>
            </div>
            <div className="h-px bg-[#333330] my-4" />
            <p className="text-[#888882] text-sm mb-1">Importe total potencial</p>
            <span className="font-display text-3xl font-bold text-[#F7F3EC]">
              {displayCount.toLocaleString('es-ES')}€
            </span>
          </div>

          {/* Lista ayudas */}
          <div className="space-y-4">
            {ayudas.map((ayuda, i) => {
              const isBlurred = i >= FREE_LIMIT
              return (
                <div
                  key={ayuda.id}
                  className={`bg-white rounded-2xl border border-[#E0DAD0] p-6 transition-all animate-slide-in delay-${Math.min(i * 100, 500)} ${isBlurred ? 'relative overflow-hidden' : ''}`}
                >
                  {isBlurred && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                      <span className="text-2xl mb-2">🔒</span>
                      <p className="font-semibold text-[#111110] text-sm text-center px-4">
                        Desbloquea todas las ayudas
                      </p>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[ayuda.tipo] || 'bg-gray-50 text-gray-700'}`}>
                          {TIPO_LABEL[ayuda.tipo] || ayuda.tipo}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ayuda.estado === 'abierta' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                          {ayuda.estado === 'abierta' ? '● Abierta' : ayuda.estado}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#111110] leading-snug">{ayuda.nombre}</h3>
                      <p className="text-xs text-[#888882] mt-0.5">{ayuda.organismo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-xl font-bold text-[#1A7A4A]">
                        {formatImporte(ayuda.importe_min, ayuda.importe_max, ayuda.importe_descripcion)}
                      </div>
                    </div>
                  </div>

                  {ayuda.descripcion && (
                    <p className="text-sm text-[#666660] mb-4 leading-relaxed">{ayuda.descripcion}</p>
                  )}

                  {ayuda.url_oficial && !isBlurred && (
                    <a
                      href={ayuda.url_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A7A4A] hover:text-[#145e39] transition-colors"
                    >
                      Ver convocatoria oficial →
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {/* Upgrade CTA */}
          {ayudas.length > FREE_LIMIT && (
            <div className="bg-[#E8540A] rounded-3xl p-8 mt-8 text-center animate-fade-up">
              <p className="text-white/80 text-sm mb-1">
                {ayudas.length - FREE_LIMIT} ayudas más bloqueadas
              </p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Cobra todo lo que te toca
              </h2>
              <p className="text-white/80 mb-6 max-w-sm mx-auto text-sm">
                Accede a todas las ayudas, alertas semanales cuando abran nuevas convocatorias y enlace directo a cada solicitud.
              </p>
              <a
                href="#pro"
                className="bg-white text-[#E8540A] font-bold px-8 py-3.5 rounded-full inline-block hover:bg-[#FEF0E8] transition-colors"
              >
                Desbloquear por 9€/mes
              </a>
              <p className="text-white/60 text-xs mt-3">Cancela cuando quieras</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-[#B0AAA0] text-center mt-10 leading-relaxed max-w-lg mx-auto">
            Los resultados son orientativos y no constituyen asesoramiento legal.
            Verifica siempre los requisitos en la fuente oficial antes de solicitar cualquier ayuda.
          </p>
        </div>
      </div>
    </>
  )
}
