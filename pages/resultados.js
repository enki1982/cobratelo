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

// Importe máximo razonable para ciudadanos (excluye macro-subvenciones empresariales)
const IMPORTE_MAX_CIUDADANO = 100000

function formatImporte(min, max, desc) {
  if (max > 0 && max <= IMPORTE_MAX_CIUDADANO) {
    if (min === max) return `${min.toLocaleString('es-ES')}€`
    if (min > 0) return `${min.toLocaleString('es-ES')}€ – ${max.toLocaleString('es-ES')}€`
    return `Hasta ${max.toLocaleString('es-ES')}€`
  }
  if (desc && desc.length > 0) return desc
  return 'Variable'
}

// Motor de matching: filtra ayudas según el perfil del usuario
function calcularRelevancia(ayuda, perfil) {
  if (!perfil) return 50
  let score = 50
  const tags = (ayuda.palabras_clave || []).map(t => t.toLowerCase())
  const nombre = (ayuda.nombre || '').toLowerCase()
  const desc = (ayuda.descripcion || '').toLowerCase()
  const texto = nombre + ' ' + desc + ' ' + tags.join(' ')

  const situacion = (perfil.situacion || [])[0]
  const edad = (perfil.edad || [])[0]
  const familia = perfil.familia || []
  const especial = perfil.especial || []
  const extras = perfil.extras || []
  const vivienda = (perfil.vivienda || [])[0]
  const ingresos = (perfil.ingresos || [])[0]

  // ── EXCLUSIONES DURAS ──────────────────────────────────────────
  // Discapacidad: solo si el usuario la marcó
  const requiereDiscapacidad = texto.includes('discapacidad') || texto.includes('invalidez') || texto.includes('minusvalía') || texto.includes('pnc') || texto.includes('pensión no contributiva de invalidez')
  if (requiereDiscapacidad && !especial.includes('discapacidad')) return 0

  // Dependencia: solo si el usuario la marcó
  const requiereDependencia = texto.includes('dependencia') && !texto.includes('independencia')
  if (requiereDependencia && !especial.includes('dependencia') && !familia.includes('dependiente_cargo')) return 0

  // Hijos: excluir ayudas de hijos si no tiene hijos
  const tieneHijos = familia.some(v => ['hijos_menores3','hijos_3_18','familia_numerosa','monoparental'].includes(v))
  const requiereHijos = (texto.includes('hijo') || texto.includes('nacimiento') || texto.includes('maternidad') || texto.includes('paternidad') || texto.includes('familia numerosa') || texto.includes('menor a cargo')) && !texto.includes('sin hijos')
  if (requiereHijos && !tieneHijos) return 0

  // Familia numerosa: solo si lo marcó
  if (texto.includes('familia numerosa') && !familia.includes('familia_numerosa')) return 0

  // Violencia de género: solo si lo marcó
  if ((texto.includes('violencia de género') || texto.includes('víctima')) && !especial.includes('victima_violencia')) return 0

  // Viudedad: solo si lo marcó
  if (texto.includes('viudedad') && !familia.includes('viudo')) return 0

  // Autónomo: solo si es autónomo
  const soloAutonomo = texto.includes('autónom') && !texto.includes('empleado') && !texto.includes('trabajador')
  if (soloAutonomo && situacion !== 'autonomo') return 0

  // Desempleo/SEPE: solo si está en paro
  const soloDesempleo = (texto.includes('desempleo') || texto.includes('sepe') || texto.includes('prestación por desempleo')) && !texto.includes('autónom')
  if (soloDesempleo && situacion !== 'desempleado') return 0

  // Pensionistas: solo si es pensionista o mayor 65
  const soloPensionista = texto.includes('pensionista') || (texto.includes('pensión') && texto.includes('jubila'))
  if (soloPensionista && situacion !== 'pensionista' && edad !== 'mayor65') return 0

  // Becas educativas: solo estudiantes o con hijos en edad escolar
  const soloEstudiante = (texto.includes('beca') && (texto.includes('universitaria') || texto.includes('educación')))
  if (soloEstudiante && situacion !== 'estudiante' && !extras.includes('estudios_hijos')) return 0

  // Vehículo eléctrico (MOVES): solo si lo marcó
  if ((texto.includes('moves') || texto.includes('vehículo eléctrico')) && !extras.includes('coche_electrico') && !extras.includes('quiero_vehiculo')) return 0

  // Mascotas: solo si tiene mascotas
  if ((texto.includes('mascota') || texto.includes('animal de compañía') || texto.includes('veterinario')) && !extras.includes('mascotas')) return 0

  // Empresa/pyme (sin autónomo): solo si tiene empresa
  const esEmpresarial = ['empresa', 'pyme', 'sociedade', 'corporativ', 'industri', 'sectorial'].some(t => texto.includes(t)) && !texto.includes('autónom')
  const tieneEmpresa = extras.some(v => ['pyme', 'negocio_digital'].includes(v)) || situacion === 'autonomo'
  if (esEmpresarial && !tieneEmpresa) return 0

  // Excluir si importe máximo es >1M y el usuario no tiene empresa
  if (ayuda.importe_max > 1000000 && !tieneEmpresa) return 0

  // ── BOOSTS POSITIVOS ───────────────────────────────────────────
  const ccaa = (perfil.ccaa || [])[0]
  if (ccaa && ayuda.comunidad_autonoma) {
    if (ayuda.comunidad_autonoma === ccaa) score += 30
    else if (ayuda.ambito === 'autonomico') score -= 20
  }
  if (ayuda.ambito === 'estatal') score += 10

  // Boost por situación laboral
  if (situacion === 'autonomo' && (texto.includes('autónom') || texto.includes('autonomo'))) score += 25
  if (situacion === 'desempleado' && (texto.includes('desempleo') || texto.includes('paro') || texto.includes('sepe'))) score += 25
  if (situacion === 'pensionista' && (texto.includes('pensión') || texto.includes('pension') || texto.includes('jubila') || texto.includes('mayores'))) score += 30
  if (situacion === 'estudiante' && (texto.includes('beca') || texto.includes('estudio') || texto.includes('educaci'))) score += 25
  if (situacion === 'emprendedor' && (texto.includes('emprendedor') || texto.includes('startup') || texto.includes('empresa'))) score += 20

  // Boost por edad
  if (edad === 'menor30' && (texto.includes('joven') || texto.includes('menor 35') || texto.includes('primera vivienda'))) score += 25
  if (edad === 'mayor65' && (texto.includes('mayor') || texto.includes('tercera edad') || texto.includes('pensión'))) score += 25

  // Boost por familia
  if (familia.includes('hijos_menores3') && (texto.includes('nacimiento') || texto.includes('bebé') || texto.includes('maternidad') || texto.includes('paternidad'))) score += 30
  if (familia.includes('familia_numerosa') && texto.includes('numerosa')) score += 30
  if (familia.includes('monoparental') && texto.includes('monoparental')) score += 30
  if (familia.includes('viudo') && texto.includes('viudedad')) score += 30
  if (familia.includes('dependiente_cargo') && (texto.includes('dependencia') || texto.includes('cuidador'))) score += 25

  // Boost por vivienda
  const vivienda = (perfil.vivienda || [])[0]
  if (vivienda === 'alquiler' && (texto.includes('alquiler') || texto.includes('arrendamiento'))) score += 25
  if (vivienda === 'rehabilitacion' && (texto.includes('rehabilita') || texto.includes('reforma') || texto.includes('eficiencia'))) score += 25

  // Boost por extras
  if (extras.includes('mascotas') && (texto.includes('mascota') || texto.includes('animal') || texto.includes('veterinario'))) score += 30
  if (extras.includes('energia') && (texto.includes('energía') || texto.includes('solar') || texto.includes('termosolar') || texto.includes('rehabilita'))) score += 25
  if (extras.includes('coche_electrico') && (texto.includes('eléctrico') || texto.includes('moves') || texto.includes('vehículo'))) score += 25
  if (extras.includes('salud_cronica') && (texto.includes('medicamento') || texto.includes('farmacia') || texto.includes('salud'))) score += 20
  if (extras.includes('gafas_audifonos') && (texto.includes('óptica') || texto.includes('audífono') || texto.includes('prótesis'))) score += 25

  // Boost por situaciones especiales
  if (especial.includes('discapacidad') && (texto.includes('discapacidad') || texto.includes('minusvalía'))) score += 35
  if (especial.includes('dependencia') && texto.includes('dependencia')) score += 35
  if (especial.includes('victima_violencia') && (texto.includes('violencia') || texto.includes('género'))) score += 40
  if (especial.includes('rural') && (texto.includes('rural') || texto.includes('municipio pequeño'))) score += 25

  // Boost por ingresos bajos
  if (['sin_ingresos', 'bajos'].includes(ingresos) && (texto.includes('renta mínima') || texto.includes('ingreso mínimo') || texto.includes('renta baja') || texto.includes('vulnerab'))) score += 25

  return score
}

const FREE_LIMIT = 3

export default function Resultados() {
  const router = useRouter()
  const [ayudas, setAyudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [displayCount, setDisplayCount] = useState(0)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    const perfilRaw = router.query.perfil
    if (perfilRaw) {
      try { setPerfil(JSON.parse(decodeURIComponent(perfilRaw))) } catch (e) {}
    }
  }, [router.isReady])

  useEffect(() => {
    if (perfil !== null) fetchAyudas()
  }, [perfil])

  const fetchAyudas = async () => {
    try {
      const { data, error } = await supabase
        .from('ayudas')
        .select('*')
        .in('estado', ['abierta', 'permanente', 'pendiente'])

      if (error) throw error

      // Aplicar motor de matching
      const conScore = (data || [])
        .map(a => ({ ...a, _score: calcularRelevancia(a, perfil) }))
        .filter(a => a._score > 0)
        .sort((a, b) => b._score - a._score)

      setAyudas(conScore)

      // Total solo con importes razonables para ciudadanos
      const sum = conScore
        .slice(0, 15)
        .reduce((acc, a) => acc + (a.importe_max > 0 && a.importe_max <= IMPORTE_MAX_CIUDADANO ? a.importe_max : 0), 0)

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

  const enviarAGestoria = async () => {
    if (!perfil?.email_gestoria) return
    setEnviando(true)
    // Simulamos el envío — aquí conectarías con tu servicio de email
    await new Promise(r => setTimeout(r, 1500))
    setEmailEnviado(true)
    setEnviando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-display text-xl text-[#111110]">Analizando tu perfil...</p>
          <p className="text-sm text-[#888882] mt-2">Cruzando con {42}+ ayudas activas en España</p>
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
        <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <Link href="/perfil" className="text-sm text-[#888882] hover:text-[#111110] transition-colors">
            ← Volver al perfil
          </Link>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pb-20">

          {/* Header */}
          <div className="bg-[#111110] rounded-3xl p-8 mb-6 animate-fade-up">
            <p className="text-[#888882] text-sm mb-2">Ayudas que podrían aplicarte</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-[#22C55E]">{ayudas.length}</span>
              <span className="text-[#888882] mb-2">ayudas encontradas</span>
            </div>
            {displayCount > 0 && (
              <>
                <div className="h-px bg-[#333330] my-4" />
                <p className="text-[#888882] text-sm mb-1">Importe potencial estimado</p>
                <span className="font-display text-3xl font-bold text-[#F7F3EC]">
                  {displayCount.toLocaleString('es-ES')}€
                </span>
                <p className="text-[#555550] text-xs mt-1">Suma de los importes máximos de las ayudas más relevantes para tu perfil</p>
              </>
            )}
          </div>

          {/* Enviar a gestoría */}
          {perfil?.email_gestoria && (
            <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111110] text-sm">Enviar informe a tu gestoría</p>
                <p className="text-xs text-[#888882] mt-0.5">{perfil.email_gestoria}</p>
              </div>
              {emailEnviado ? (
                <span className="text-[#1A7A4A] font-semibold text-sm">✓ Enviado</span>
              ) : (
                <button
                  onClick={enviarAGestoria}
                  disabled={enviando}
                  className="bg-[#1A7A4A] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#145e39] transition-colors disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Enviar →'}
                </button>
              )}
            </div>
          )}

          {/* Lista */}
          <div className="space-y-4">
            {ayudas.map((ayuda, i) => {
              const isBlurred = i >= FREE_LIMIT
              return (
                <div key={ayuda.id}
                  className={`bg-white rounded-2xl border border-[#E0DAD0] p-6 transition-all ${isBlurred ? 'relative overflow-hidden' : ''}`}>
                  {isBlurred && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center z-10 rounded-2xl">
                      <span className="text-2xl mb-2">🔒</span>
                      <p className="font-semibold text-[#111110] text-sm text-center px-4">
                        {ayudas.length - FREE_LIMIT} ayudas más bloqueadas
                      </p>
                      <p className="text-xs text-[#888882] mt-1">Desbloquea con Pro</p>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[ayuda.tipo] || 'bg-gray-50 text-gray-700'}`}>
                          {TIPO_LABEL[ayuda.tipo] || ayuda.tipo}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ayuda.estado === 'abierta' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                          {ayuda.estado === 'abierta' ? '● Abierta' : ayuda.estado}
                        </span>
                        {ayuda.ambito === 'autonomico' && ayuda.comunidad_autonoma && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {ayuda.comunidad_autonoma}
                          </span>
                        )}
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
                    <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A7A4A] hover:text-[#145e39] transition-colors">
                      Ver convocatoria oficial →
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Pro */}
          {ayudas.length > FREE_LIMIT && (
            <div className="bg-[#E8540A] rounded-3xl p-8 mt-8 text-center animate-fade-up">
              <p className="text-white/80 text-sm mb-1">{ayudas.length - FREE_LIMIT} ayudas más bloqueadas</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Cobra todo lo que te toca
              </h2>
              <p className="text-white/80 mb-6 max-w-sm mx-auto text-sm">
                Accede a todas las ayudas, alertas cuando abran nuevas convocatorias y envío directo a tu gestoría.
              </p>
              <button className="bg-white text-[#E8540A] font-bold px-8 py-3.5 rounded-full inline-block hover:bg-[#FEF0E8] transition-colors">
                Desbloquear por 9€/mes
              </button>
              <p className="text-white/60 text-xs mt-3">Cancela cuando quieras</p>
            </div>
          )}

          {ayudas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-[#111110]">No hemos encontrado ayudas específicas para tu perfil</p>
              <p className="text-sm text-[#888882] mt-2">Prueba a revisar tu perfil o ampliar las categorías seleccionadas.</p>
              <Link href="/perfil" className="inline-block mt-4 bg-[#111110] text-[#F7F3EC] px-6 py-3 rounded-full font-semibold text-sm">
                Revisar mi perfil
              </Link>
            </div>
          )}

          <p className="text-xs text-[#B0AAA0] text-center mt-10 leading-relaxed max-w-lg mx-auto">
            Los resultados son orientativos y no constituyen asesoramiento legal ni financiero.
            Verifica siempre los requisitos en la fuente oficial antes de solicitar cualquier ayuda.
          </p>
        </div>
      </div>
    </>
  )
}
