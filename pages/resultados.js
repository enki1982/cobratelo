import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const TIPO_LABEL = {
  prestacion: 'Prestación', subvencion: 'Subvención', deduccion: 'Deducción fiscal',
  servicio: 'Servicio', bonificacion: 'Bonificación', prestamo: 'Préstamo',
}
const TIPO_COLOR = {
  prestacion: 'bg-blue-50 text-blue-700', subvencion: 'bg-green-50 text-green-700',
  deduccion: 'bg-purple-50 text-purple-700', servicio: 'bg-yellow-50 text-yellow-700',
  bonificacion: 'bg-orange-50 text-orange-700', prestamo: 'bg-gray-50 text-gray-700',
}
const IMPORTE_MAX_CIUDADANO = 30000

function formatImporte(min, max, desc, tipo) {
  if (tipo === 'deduccion') return desc || 'Deducción fiscal'
  if (max > 0 && max <= IMPORTE_MAX_CIUDADANO) {
    if (min > 0 && min !== max) return `${min.toLocaleString('es-ES')}€ – ${max.toLocaleString('es-ES')}€`
    if (min === max && min > 0) return `${min.toLocaleString('es-ES')}€`
    return `Hasta ${max.toLocaleString('es-ES')}€`
  }
  return desc || 'Variable'
}

// Normaliza texto quitando acentos y pasando a minúsculas
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// ── MOTOR DE MATCHING ────────────────────────────────────────────────────────
// Regla fundamental: score empieza en 0. Una ayuda solo aparece si tiene
// al menos un match positivo EXPLÍCITO con el perfil del usuario.
// Score mínimo para aparecer: 30 puntos.
function calcularRelevancia(ayuda, perfil) {
  if (!perfil) return 0

  const situacion = (perfil.situacion || [])[0] || ''
  const edadNum   = parseInt((perfil.edad || [])[0]) || 0
  const familia   = perfil.familia || []
  const viviendas = perfil.vivienda || []
  const ingresos  = (perfil.ingresos || [])[0] || ''
  const especial  = perfil.especial || []
  const extras    = perfil.extras || []
  const ccaa      = (perfil.ccaa || [])[0] || ''
  const provincia = (perfil.provincia || [])[0] || ''

  const tieneHijos    = familia.some(v => ['hijos_menores3','hijos_3_18','familia_numerosa','monoparental'].includes(v))
  const tieneEmpresa  = extras.some(v => ['pyme','negocio_digital'].includes(v)) || ['autonomo','emprendedor'].includes(situacion)
  const tieneVehiculo = (perfil.vehiculo || []).some(v => v !== 'sin_vehiculo')
  const esAlquiler    = viviendas.includes('alquiler')
  const esPropietario = viviendas.some(v => ['propietario','hipoteca'].includes(v))
  const quiereComprar = viviendas.some(v => ['busco_vivienda','hipoteca'].includes(v))
  const quiereRehabilitacion = viviendas.includes('rehabilitacion')

  // Texto normalizado para matching
  const t = norm(`${ayuda.nombre} ${ayuda.descripcion} ${(ayuda.palabras_clave||[]).join(' ')} ${ayuda.organismo}`)

  let score = 0

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1: FILTROS GEOGRÁFICOS (retornan 0 si no aplica)
  // ════════════════════════════════════════════════════════════

  if (ayuda.ambito === 'autonomico') {
    if (!ccaa) return 0
    if (ayuda.comunidad_autonoma && ayuda.comunidad_autonoma !== ccaa) return 0
  }

  if (['municipal','comarcal'].includes(ayuda.ambito)) {
    if (!provincia) return 0
  }

  // Exclusión textual: si la ayuda menciona otra provincia/comarca en el texto u organismo
  if (provincia) {
    const OTRAS_PROV = {
      'barcelona':   ['tarragones','tarragona','girona','girones','lleida','sevilla','madrid','valencia','zaragoza','malaga','murcia','baix camp','terra alta','priorat','ribera d ebre','alt camp','baix penedes','montsia'],
      'girona':      ['barcelona','tarragona','tarragones','lleida','madrid','sevilla','baix camp','garraf'],
      'tarragona':   ['barcelona','barcelones','girona','girones','lleida','madrid','maresme','garraf','bages'],
      'lleida':      ['barcelona','girona','tarragona','tarragones','madrid','maresme'],
      'madrid_prov': ['barcelona','valencia','sevilla','zaragoza','bilbao','malaga','girona','tarragona'],
      'sevilla':     ['barcelona','madrid','valencia','malaga','granada','cadiz','cordoba','huelva','jaen','almeria','girona'],
      'malaga':      ['barcelona','madrid','sevilla','granada','cadiz','cordoba','huelva','jaen','almeria'],
      'valencia_c':  ['barcelona','alicante','castellon','madrid','tarragona','girona'],
      'alicante':    ['barcelona','valencia','castellon','madrid'],
      'zaragoza':    ['barcelona','madrid','huesca','teruel','lleida','pamplona'],
      'bilbao':      ['barcelona','madrid','donostia','vitoria','pamplona','zaragoza'],
    }
    const excluir = OTRAS_PROV[provincia] || []
    if (excluir.some(p => t.includes(p))) return 0
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 2: EXCLUSIONES DURAS (retornan 0 si no aplica)
  // ════════════════════════════════════════════════════════════

  // Situación laboral
  if (situacion === 'pensionista') {
    if (/insercio|insercion laboral|emprendedor|startup|tarifa plana|alta.*autono|cuota.*autono|desempleo|sepe |erte/.test(t)) return 0
  }
  if (situacion === 'empleado') {
    if (/tarifa plana|alta.*autono/.test(t)) return 0
  }
  if (situacion === 'estudiante') {
    if (/jubilacio|jubilacion|insercio|insercion laboral/.test(t)) return 0
  }

  // Edad
  if (edadNum > 0) {
    if (/mayor(es)? de 65|65 anys o mes|a partir dels 65/.test(t) && edadNum < 65) return 0
    if (/menor(es)? de 3[05]|fins a 3[05]|hasta 3[05]|joves? fins|jovens? fins/.test(t) && edadNum >= 35) return 0
    if (/18.65|menors? de 65|fins als 65/.test(t) && edadNum >= 65) return 0
    if (/36.64|36 a 64|entre 36 i 64/.test(t) && !(edadNum >= 36 && edadNum <= 64)) return 0
  }

  // Familia
  if (!tieneHijos) {
    if (/famili.* nombrosa|familia numerosa|fill a carrec|hijo a cargo|beca.*comedor|menjador escolar|naix|nacimiento|maternit|paternit/.test(t)
        && !familia.includes('embarazada')) return 0
  }
  if (!familia.includes('embarazada') && !familia.includes('hijos_menores3') && /maternit|paternit|naix|nacimiento/.test(t)) return 0
  if (!familia.includes('familia_numerosa') && /familia nombrosa|familia numerosa/.test(t)) return 0
  if (!familia.includes('viudo') && /viudedat|viudedad|viuvez|alarguntzapen/.test(t)) return 0
  if (!familia.includes('monoparental') && /monoparental/.test(t)) return 0
  if ((!familia.includes('dependiente_cargo') && !especial.includes('dependencia')) && /cuidador no professional|cuidador no profesional/.test(t)) return 0
  if ((!tieneHijos || !especial.includes('discapacidad')) && /fill a carrec.*discapacitat|hijo a cargo.*discapacidad/.test(t)) return 0

  // Vivienda
  const esAyAlquiler = /alquiler|arrendatari|lloguer|ajut al lloguer|aluger|alugueiro|alokairu|alokairua/.test(t) && !/propietari/.test(t)
  if (esAyAlquiler && !esAlquiler) return 0
  if (/primer acces|primer acceso|primera habitatge|primera vivienda/.test(t) && !quiereComprar) return 0
  if (/rehabilitac|reforma energet/.test(t) && !esPropietario && !quiereRehabilitacion) return 0

  // Ingresos
  if (ingresos === 'altos' && /vulnerabilitat|vulnerabilidad|risc.*exclusio|riesgo.*exclusion|sense recursos|sin recursos/.test(t)) return 0
  if (['medios','altos'].includes(ingresos) && /ingres minim vital|ingreso minimo vital|imv|renda minima|renta minima/.test(t)) return 0

  // Situaciones especiales
  if (!especial.includes('discapacidad') && /certificat.*discapacitat|certificado.*discapacidad|pnc.*invalidesa|pnc.*invalidez|protesi|protesis|audiofon|audifon/.test(t)) return 0
  if (!especial.includes('dependencia') && !familia.includes('dependiente_cargo') && /grau.*dependencia|grado.*dependencia|situacio.*dependencia|saad|mendekotasuna/.test(t)) return 0
  if (!especial.includes('victima_violencia') && /violencia.*genere|violencia.*genero/.test(t)) return 0
  if (!especial.includes('rural') && /zona rural|despoblacio|municipio rural/.test(t)) return 0
  if (!especial.includes('inmigrante') && /reagrupacio familiar|reagrupacion familiar|permis.*residencia/.test(t)) return 0

  // Vehículo
  if (!tieneVehiculo && /moves|plan renove|vehicle electric|vehiculo electrico/.test(t)) return 0

  // Mascotas
  if (!extras.includes('mascotas') && /mascota|esterilitzacio|esterilizacion|xip.*obligatori|chip.*obligatorio/.test(t)) return 0

  // Empresa/digital
  if (!tieneEmpresa) {
    if (/kit digital|digitalitzacio.*empresa|persona juridica|empresa beneficiaria/.test(t)) return 0
    if ((ayuda.importe_max || 0) > 500000) return 0
  }

  // Becas universitarias
  if (!['estudiante'].includes(situacion) && !extras.includes('estudios_hijos')) {
    if (/beca mec|beca universitaria|beca.*universitat/.test(t)) return 0
  }

  // Gafas/salud específica
  if (!extras.includes('gafas_audifonos') && !especial.includes('discapacidad')) {
    if (/ajuda optica|ayuda optica|gafas.*subvencio/.test(t)) return 0
  }

  // Energía
  if (!extras.includes('energia') && !quiereRehabilitacion) {
    if (/panells solars|paneles solares|aerotermia|bomba.*calor.*subvencio/.test(t)) return 0
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 3: BOOSTS POSITIVOS EXPLÍCITOS
  // Una ayuda DEBE ganar al menos 30 puntos para aparecer.
  // Sin match positivo explícito = no aparece.
  // ════════════════════════════════════════════════════════════

  // Variantes lingüísticas adicionales en el texto normalizado:
  // Gallego: xubilacion, desemprego, vivenda, aluger, familia, discapacidade
  // Euskera: erretiro, langabezia, etxebizitza, alokairu, familia, desgaitasuna
  // Valenciano: (comparte con catalán en gran medida)
  // Asturiano: xubilacion, desemplegu, vivienda
  // Los patrones regex ya cubren estas variantes con raíces compartidas

  // Situación laboral
  if (situacion === 'pensionista' && /pensio|pension|jubila|xubila|erretiro/.test(t)) score += 40
  if (situacion === 'autonomo' && /autono/.test(t)) score += 40
  if (situacion === 'desempleado' && /desempleo|atur|paro|sepe|desemprego|langabezia|desemplegu/.test(t)) score += 40
  if (situacion === 'estudiante' && /beca|estudi/.test(t)) score += 40
  if (situacion === 'emprendedor' && /emprendedor|startup|nova empresa/.test(t)) score += 35
  if (situacion === 'empleado' && /treballador|trabajador por cuenta ajena/.test(t)) score += 35

  // Edad
  if (edadNum >= 65 && /gent gran|major|tercera edat|majors/.test(t)) score += 35
  if (edadNum < 30 && /jove|joven|menors de 30|jovens/.test(t)) score += 35
  if (edadNum >= 30 && edadNum < 65 && /persones.*36.64|entre 36 i 64/.test(t)) score += 40

  // Familia
  if (tieneHijos && /fill|hijo|familia|seme.alaba|fillos|fillo/.test(t)) score += 25
  if (familia.includes('familia_numerosa') && /nombrosa|numerosa/.test(t)) score += 40
  if (familia.includes('monoparental') && /monoparental/.test(t)) score += 40
  if (familia.includes('viudo') && /viudedad|viudedat/.test(t)) score += 40
  if (familia.includes('embarazada') && /maternit|naix|nacimiento/.test(t)) score += 40
  if (familia.includes('hijos_menores3') && /naix|nacimiento|maternit|paternit/.test(t)) score += 40
  if (familia.includes('dependiente_cargo') && /dependencia|cuidador/.test(t)) score += 35

  // Vivienda
  if (esAlquiler && /lloguer|alquiler|aluger|alokairu|alugueiro/.test(t)) score += 35
  if (quiereComprar && /primer acces|primera vivienda|compra.*vivienda/.test(t)) score += 35
  if (quiereRehabilitacion && /rehabilita|birgaikuntza/.test(t)) score += 35

  // Ingresos bajos
  if (['sin_ingresos','bajos'].includes(ingresos) && /vulnerab|renda baixa|renta baja|imv|minima/.test(t)) score += 30

  // Situaciones especiales
  if (especial.includes('discapacidad') && /discapacitat|discapacidad|discapacidade|desgaitasuna/.test(t)) score += 40
  if (especial.includes('dependencia') && /dependencia/.test(t)) score += 40
  if (especial.includes('victima_violencia') && /violencia/.test(t)) score += 40
  if (especial.includes('rural') && /rural|despoblacio/.test(t)) score += 35

  // Extras
  if (tieneVehiculo && /moves|vehicle electric|vehiculo electrico/.test(t)) score += 35
  if (extras.includes('mascotas') && /mascota|veterinari/.test(t)) score += 35
  if (extras.includes('energia') && /eficiencia energetica|rehabilita|solar/.test(t)) score += 30
  if (tieneEmpresa && /autono|kit digital|digitalitzacio/.test(t)) score += 30
  if (extras.includes('gafas_audifonos') && /optica|gafes|audiofon/.test(t)) score += 35

  // CCAA/Provincia match explícito (bonus adicional)
  if (ccaa && ayuda.comunidad_autonoma === ccaa) score += 15
  if (['municipal','comarcal'].includes(ayuda.ambito) && provincia) score += 10

  // Bono social: aplica a ingresos bajos o vulnerables
  if (/bono social|bo social/.test(t) && ['sin_ingresos','bajos'].includes(ingresos)) score += 30

  return score
}

const FREE_LIMIT = 3

export default function Resultados() {
  const router = useRouter()
  const [ayudas, setAyudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [totalEstimado, setTotalEstimado] = useState(0)
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
      const { data } = await supabase
        .from('ayudas')
        .select('*')
        .in('estado', ['abierta', 'permanente', 'pendiente'])

      const conScore = (data || [])
        .map(a => ({ ...a, _score: calcularRelevancia(a, perfil) }))
        .filter(a => a._score >= 30)
        .sort((a, b) => b._score - a._score)
        .slice(0, 20)

      setAyudas(conScore)

      const total = conScore
        .filter(a => !['deduccion','prestamo'].includes(a.tipo))
        .filter(a => a.importe_max > 0 && a.importe_max <= IMPORTE_MAX_CIUDADANO)
        .slice(0, 5)
        .reduce((acc, a) => acc + a.importe_max, 0)
      setTotalEstimado(total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const enviarAGestoria = async () => {
    if (!perfil?.email_gestoria) return
    setEnviando(true)
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
          <p className="text-sm text-[#888882] mt-2">Buscando ayudas para tu situación específica</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Tus ayudas — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#888882] hover:text-[#111110] transition-colors">Inicio</Link>
            <Link href="/perfil" className="text-sm text-[#888882] hover:text-[#111110] transition-colors">← Cambiar perfil</Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="bg-[#111110] rounded-3xl p-8 mb-6">
            <p className="text-[#888882] text-sm mb-2">Ayudas que encajan con tu perfil</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-[#22C55E]">{ayudas.length}</span>
              <span className="text-[#888882] mb-2">ayudas encontradas</span>
            </div>
            {totalEstimado > 0 && (
              <>
                <div className="h-px bg-[#333330] my-4" />
                <p className="text-[#888882] text-sm mb-1">Importe máximo potencial (top 5)</p>
                <span className="font-display text-3xl font-bold text-[#F7F3EC]">
                  {totalEstimado.toLocaleString('es-ES')}€
                </span>
                <p className="text-[#555550] text-xs mt-1">
                  Solo subvenciones y prestaciones directas. Las deducciones fiscales no están incluidas.
                </p>
              </>
            )}
          </div>

          {perfil?.email_gestoria && (
            <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111110] text-sm">Enviar informe a tu gestoría</p>
                <p className="text-xs text-[#888882] mt-0.5">{perfil.email_gestoria}</p>
              </div>
              {emailEnviado ? (
                <span className="text-[#1A7A4A] font-semibold text-sm">✓ Enviado</span>
              ) : (
                <button onClick={enviarAGestoria} disabled={enviando}
                  className="bg-[#1A7A4A] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#145e39] transition-colors disabled:opacity-60">
                  {enviando ? 'Enviando...' : 'Enviar →'}
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {ayudas.map((ayuda, i) => {
              const isBlurred = i >= FREE_LIMIT
              return (
                <div key={ayuda.id}
                  className={`bg-white rounded-2xl border border-[#E0DAD0] p-6 ${isBlurred ? 'relative overflow-hidden' : ''}`}>
                  {isBlurred && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center z-10 rounded-2xl cursor-pointer"
                      onClick={() => document.getElementById('cta-pro')?.scrollIntoView({ behavior: 'smooth' })}>
                      <span className="text-2xl mb-2">🔒</span>
                      <p className="font-semibold text-[#111110] text-sm text-center px-4">
                        {ayudas.length - FREE_LIMIT} ayudas más
                      </p>
                      <span className="mt-2 bg-[#E8540A] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        Desbloquear →
                      </span>
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
                        {ayuda.ambito !== 'estatal' && ayuda.comunidad_autonoma && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {ayuda.comunidad_autonoma}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#111110] leading-snug">{ayuda.nombre}</h3>
                      <p className="text-xs text-[#888882] mt-0.5">{ayuda.organismo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg font-bold text-[#1A7A4A]">
                        {formatImporte(ayuda.importe_min, ayuda.importe_max, ayuda.importe_descripcion, ayuda.tipo)}
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

          {ayudas.length > FREE_LIMIT && (
            <div id="cta-pro" className="bg-[#E8540A] rounded-3xl p-8 mt-8 text-center">
              <p className="text-white/80 text-sm mb-1">{ayudas.length - FREE_LIMIT} ayudas más bloqueadas</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Cobra todo lo que te toca</h2>
              <p className="text-white/80 mb-6 max-w-sm mx-auto text-sm">
                Accede a todas las ayudas, alertas semanales y envío directo a tu gestoría.
              </p>
              <a href="/precios" className="bg-white text-[#E8540A] font-bold px-8 py-3.5 rounded-full inline-block hover:bg-[#FEF0E8] transition-colors">
                Ver planes desde 0,99€/mes
              </a>
              <p className="text-white/60 text-xs mt-3">Cancela cuando quieras</p>
            </div>
          )}

          {ayudas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-[#111110]">No hemos encontrado ayudas específicas para tu perfil</p>
              <p className="text-sm text-[#888882] mt-2">Prueba a revisar tu perfil o ampliar las categorías.</p>
              <Link href="/perfil" className="inline-block mt-4 bg-[#111110] text-[#F7F3EC] px-6 py-3 rounded-full font-semibold text-sm">
                Revisar mi perfil
              </Link>
            </div>
          )}

          <p className="text-xs text-[#B0AAA0] text-center mt-10 leading-relaxed max-w-lg mx-auto">
            Los resultados son orientativos. Verifica siempre los requisitos en la fuente oficial antes de solicitar cualquier ayuda.
          </p>
        </div>
      </div>
    </>
  )
}
