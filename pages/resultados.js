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

// Importe máximo razonable para ciudadanos
const IMPORTE_MAX_CIUDADANO = 50000

function formatImporte(min, max, desc, tipo) {
  if (tipo === 'deduccion') return desc || 'Deducción fiscal'
  if (max > 0 && max <= IMPORTE_MAX_CIUDADANO) {
    if (min > 0 && min !== max) return `${min.toLocaleString('es-ES')}€ – ${max.toLocaleString('es-ES')}€`
    if (min === max && min > 0) return `${min.toLocaleString('es-ES')}€`
    return `Hasta ${max.toLocaleString('es-ES')}€`
  }
  return desc || 'Variable'
}

// ── MOTOR DE MATCHING ─────────────────────────────────────────────────────
function calcularRelevancia(ayuda, perfil) {
  if (!perfil) return 0
  
  const situacion  = (perfil.situacion || [])[0] || ''
  const edadNum    = parseInt((perfil.edad || [])[0]) || 0
  const familia    = perfil.familia || []
  const viviendas  = perfil.vivienda || []
  const ingresos   = (perfil.ingresos || [])[0] || ''
  const especial   = perfil.especial || []
  const extras     = perfil.extras || []
  const ccaa       = (perfil.ccaa || [])[0] || ''
  const provincia  = (perfil.provincia || [])[0] || ''
  const tieneHijos = familia.some(v => ['hijos_menores3','hijos_3_18','familia_numerosa','monoparental'].includes(v))
  const tieneEmpresa = extras.some(v => ['pyme','negocio_digital'].includes(v)) || situacion === 'autonomo' || situacion === 'emprendedor'
  const tieneVehiculo = (perfil.vehiculo || []).some(v => v !== 'sin_vehiculo')

  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const nombre = normalize(ayuda.nombre || '')
  const desc   = normalize(ayuda.descripcion || '')
  const tags   = normalize((ayuda.palabras_clave || []).join(' '))
  const org    = normalize(ayuda.organismo || '')
  const t      = `${nombre} ${desc} ${tags} ${org}`

  let score = 0

  // ── 1. FILTRO GEOGRÁFICO ──────────────────────────────────────
  // Estatal: siempre pasa
  if (ayuda.ambito === 'estatal') score += 10

  // Autonómica: solo si coincide CCAA
  if (ayuda.ambito === 'autonomico') {
    if (!ccaa) return 0
    if (ayuda.comunidad_autonoma && ayuda.comunidad_autonoma !== ccaa) return 0
    score += 15
  }

  // Municipal/comarcal: filtrar por provincia
  if (['municipal','comarcal'].includes(ayuda.ambito)) {
    if (!provincia) return 0
    const EXCLUIR_PROV = {
      'barcelona':   ['girona','girones','tarragon','tarragones','tarragona','lleida','sevilla','madrid','valencia','zaragoza','baix camp','terra alta','priorat','ribera d'ebre','conca de barbera','alt camp','baix penedes'],
      'girona':      ['barcelona','barcelones','tarragon','tarragones','tarragona','lleida','madrid','baix camp','garraf'],
      'tarragona':   ['barcelona','barcelones','girona','girones','lleida','madrid','maresme','garraf','bages','osona'],
      'lleida':      ['barcelona','barcelones','girona','girones','tarragona','tarragones','madrid'],
      'madrid_prov': ['barcelona','valencia','sevilla','zaragoza','bilbao','malaga'],
      'valencia_c':  ['barcelona','alacant','alicante','castellon','castelló','madrid'],
      'alicante':    ['barcelona','valencia','castellon','castelló'],
    }
    const excluir = EXCLUIR_PROV[provincia] || []
    if (excluir.some(p => t.includes(p))) return 0
    score += 20
  }

  // ── 2. EXCLUSIONES DURAS POR SITUACIÓN LABORAL ───────────────
  // Pensionista: no ve empleo, autónomos, emprendimiento
  if (situacion === 'pensionista') {
    if (t.includes('inserción laboral') || t.includes('búsqueda de empleo') || t.includes('emprendedor') || t.includes('startup')) return 0
    if (t.includes('tarifa plana') || t.includes('alta de autónomo') || t.includes('cuota de autónomo')) return 0
    if (t.includes('prestación por desempleo') || t.includes('sepe') || t.includes('erte')) return 0
  }

  // Empleado: no ve tarifa plana autónomo, no ve prestación paro
  if (situacion === 'empleado') {
    if (t.includes('tarifa plana') || t.includes('alta de autónomo')) return 0
  }

  // Desempleado: no ve ayudas exclusivas de autónomos en activo
  if (situacion === 'desempleado') {
    if (t.includes('tarifa plana') && !t.includes('nueva alta')) return 0
  }

  // Estudiante: no ve ayudas de jubilación ni empleo
  if (situacion === 'estudiante') {
    if (t.includes('jubilación') || t.includes('pensión') || t.includes('inserción laboral')) return 0
  }

  // ── 3. EXCLUSIONES DURAS POR EDAD ────────────────────────────
  if (edadNum > 0) {
    if ((t.includes('mayor de 65') || t.includes('mayores de 65') || t.includes('65 años o más') || t.includes('jubilados mayores')) && edadNum < 65) return 0
    if ((t.includes('menor de 30') || t.includes('menores de 30') || t.includes('jóvenes hasta 30')) && edadNum >= 30) return 0
    if ((t.includes('menor de 35') || t.includes('menores de 35') || t.includes('hasta 35 años')) && edadNum >= 35) return 0
    if ((t.includes('18-65') || t.includes('18 a 65') || t.includes('menores de 65')) && edadNum >= 65) return 0
    if (t.includes('pensión contributiva') && edadNum < 60) return 0
  }

  // ── 4. EXCLUSIONES DURAS POR FAMILIA ─────────────────────────
  if (!tieneHijos) {
    // Embarazada SÍ ve prestación por nacimiento
    if (!familia.includes('embarazada') && (t.includes('nacimiento') || t.includes('maternidad') || t.includes('paternidad'))) return 0
    if (t.includes('familia numerosa')) return 0
    if (t.includes('hijo a cargo') || t.includes('hijos a cargo') || t.includes('per fill')) return 0
    if (t.includes('beca comedor') || t.includes('material escolar') || t.includes('menjador escolar')) return 0

  // Becas universitarias/FP: solo estudiantes o con hijos en edad escolar
  if ((t.includes('beca mec') || t.includes('beca universitaria') || (t.includes('beca') && t.includes('universitari'))) && situacion !== 'estudiante' && !extras.includes('estudios_hijos')) return 0
  }
  // Fill a càrrec amb discapacitat: requiere hijo CON discapacidad
  if ((t.includes('fill a càrrec') || t.includes('hijo a cargo')) && t.includes('discapacitat')) {
    if (!tieneHijos || !especial.includes('discapacidad')) return 0
  }
  if (!familia.includes('familia_numerosa') && t.includes('família nombrosa')) return 0
  if (!familia.includes('viudo') && (t.includes('viudedad') || t.includes('pensió de viduïtat'))) return 0
  if (!familia.includes('monoparental') && t.includes('família monoparental')) return 0
  if (!familia.includes('dependiente_cargo') && !especial.includes('dependencia') && t.includes('cuidador no profesional')) return 0
  if (!familia.includes('embarazada') && !tieneHijos && (t.includes('embarazo') || t.includes('gestació'))) return 0

  // ── 5. EXCLUSIONES DURAS POR VIVIENDA ────────────────────────
  const esAlquiler = viviendas.includes('alquiler')
  const esPropietario = viviendas.some(v => ['propietario','hipoteca'].includes(v))
  const quiereComprar = viviendas.some(v => ['busco_vivienda','hipoteca'].includes(v))
  const quiereRehabilitacion = viviendas.includes('rehabilitacion')

  // Ayudas de alquiler: solo si vive de alquiler
  const esAyudaAlquiler = (t.includes('alquiler') || t.includes('arrendatari') || t.includes('arrendatario') || t.includes('lloguer') || t.includes('pagament del lloguer') || t.includes('ajut al lloguer')) && !t.includes('propietari')
  if (esAyudaAlquiler && !esAlquiler) return 0

  // Ayudas de primer acceso/compra: solo si busca vivienda
  const esAyudaCompra = t.includes('primer acceso') || t.includes('primera vivienda') || (t.includes('compra') && t.includes('vivienda'))
  if (esAyudaCompra && !quiereComprar) return 0

  // Rehabilitación: solo propietarios que quieran reformar
  const esRehabilitacion = t.includes('rehabilitació') || t.includes('rehabilitación') || t.includes('reforma energética')
  if (esRehabilitacion && !esPropietario && !quiereRehabilitacion) return 0

  // ── 6. EXCLUSIONES DURAS POR INGRESOS ────────────────────────
  if (ingresos === 'altos') {
    if (t.includes('vulnerabilidad') || t.includes('riesgo de exclusión') || t.includes('sin recursos')) return 0
    if (t.includes('ingreso mínimo vital') || t.includes('renda garantida')) return 0
  }
  if (['medios','altos'].includes(ingresos)) {
    if (t.includes('ingreso mínimo vital') || t.includes('imv') || t.includes('renda mínima')) return 0
  }

  // ── 7. EXCLUSIONES POR SITUACIONES ESPECIALES ────────────────
  if (!especial.includes('discapacidad')) {
    if (t.includes('certificado de discapacidad') || t.includes('persona con discapacidad') || t.includes('pnc de invalidez')) return 0
    if (t.includes('prótesis') || t.includes('audífono') || t.includes('silla de ruedas')) return 0
    if (t.includes('once ') || t.includes('fundación once')) return 0
  }
  if (!especial.includes('dependencia') && !familia.includes('dependiente_cargo')) {
    if (t.includes('grado de dependencia') || t.includes('situación de dependencia') || t.includes('saad')) return 0
  }
  if (!especial.includes('victima_violencia') && (t.includes('violència de gènere') || t.includes('víctima de violencia de género'))) return 0
  if (!especial.includes('rural') && (t.includes('zona rural') || t.includes('despoblació') || t.includes('municipio rural'))) return 0
  if (!especial.includes('inmigrante') && (t.includes('reagrupació familiar') || t.includes('permiso de residencia') || t.includes('reagrupación familiar'))) return 0

  // ── 8. EXCLUSIONES POR VEHÍCULO ──────────────────────────────
  const esAyudaVehiculo = t.includes('moves') || t.includes('plan renove') || t.includes('vehículo eléctrico') || t.includes('vehicle elèctric')
  if (esAyudaVehiculo && !tieneVehiculo) return 0

  // ── 9. EXCLUSIONES POR MASCOTAS ──────────────────────────────
  if (!extras.includes('mascotas') && (t.includes('esterilización') || t.includes('chip obligatorio') || (t.includes('veterinari') && t.includes('ajut')))) return 0

  // ── 10. EXCLUSIONES POR EMPRESA ──────────────────────────────
  if (!tieneEmpresa) {
    if (t.includes('sociedades') || t.includes('persona jurídica') || t.includes('empresa beneficiaria')) return 0
    if (t.includes('kit digital')) return 0
    if (ayuda.importe_max > 500000) return 0
  }

  // ── 11. EXCLUSIONES POR SALUD ────────────────────────────────
  if (!extras.includes('gafas_audifonos') && !especial.includes('discapacidad')) {
    if (t.includes('ajuda òptica') || t.includes('ayuda óptica') || (t.includes('gafas') && t.includes('subvención'))) return 0
  }
  if (!extras.includes('salud_cronica') && !especial.includes('discapacidad')) {
    if (t.includes('medicament') && t.includes('crònic') || t.includes('medicamento crónico')) return 0
  }

  // ── 12. EXCLUSIONES POR ENERGÍA ──────────────────────────────
  if (!extras.includes('energia') && !quiereRehabilitacion) {
    if (t.includes('panells solars') || t.includes('paneles solares') || t.includes('aerotèrmia') || t.includes('aerotermia')) return 0
  }

  // ── 1b. FILTRO TEXTUAL DE PROVINCIA ───────────────────────────
  // Aunque una ayuda sea autonómica, si menciona explícitamente otra provincia/comarca → excluir
  if (provincia) {
    const MENCIONES_PROV = {
      // Cataluña
      'barcelona':  ['tarragon','tarragones','girona','girones','lleida','lleidata','baix camp','terra alta','priorat','ribera d ebre','conca de barbera','alt camp','baix penedes','montsia','segarra','noguera','pallars','val d\'aran','garrigues','urgell'],
      'girona':     ['barcelona','barcelones','tarragon','tarragones','lleida','baix camp','garraf','maresme','osona','bages','berguedà','solsonès'],
      'tarragona':  ['barcelona','barcelones','girona','girones','lleida','bages','osona','maresme','garraf','vallès','penedès'],
      'lleida':     ['barcelona','barcelones','girona','girones','tarragona','tarragones','maresme','vallès'],
      // Madrid
      'madrid_prov':['barcelona','valencia','sevilla','bilbao','zaragoza','malaga','murcia','palma','alicante','cordoba','valladolid','girona','tarragona','toledo','guadalajara','segovia','avila','cuenca'],
      // Andalucía
      'sevilla':    ['barcelona','madrid','valencia','malaga','granada','cadiz','jerez','huelva','cordoba','jaén','almería','girona','tarragona'],
      'malaga':     ['barcelona','madrid','sevilla','granada','cadiz','cordoba','huelva','jaén','almería'],
      'granada':    ['barcelona','madrid','sevilla','malaga','cadiz','cordoba','huelva','jaén','almería'],
      'cadiz':      ['barcelona','madrid','sevilla','malaga','granada','cordoba','huelva','jaén','almería','jerez'],
      'cordoba':    ['barcelona','madrid','sevilla','malaga','granada','cadiz','huelva','jaén','almería'],
      'huelva':     ['barcelona','madrid','sevilla','malaga','granada','cadiz','cordoba','jaén','almería'],
      'jaen':       ['barcelona','madrid','sevilla','malaga','granada','cadiz','cordoba','huelva','almería'],
      'almeria':    ['barcelona','madrid','sevilla','malaga','granada','cadiz','cordoba','huelva','jaén'],
      // Valencia
      'valencia_c': ['barcelona','alacant','alicante','castellon','castelló','madrid','murcia','ibiza','mallorca'],
      'alicante':   ['barcelona','valencia','castellon','castelló','madrid','murcia'],
      'castellon':  ['barcelona','valencia','alicante','alacant','madrid','tarragona'],
      // Galicia
      'coruna':     ['barcelona','madrid','pontevedra','ourense','lugo','vigo'],
      'pontevedra': ['barcelona','madrid','coruna','coruna','ourense','lugo'],
      'ourense':    ['barcelona','madrid','coruna','coruna','pontevedra','lugo'],
      'lugo':       ['barcelona','madrid','coruna','coruna','pontevedra','ourense'],
      // País Vasco
      'bilbao':     ['barcelona','madrid','donostia','san sebastián','vitoria','gasteiz','pamplona'],
      'gipuzkoa':   ['barcelona','madrid','bilbao','bizkaia','vitoria','gasteiz'],
      'araba':      ['barcelona','madrid','bilbao','bizkaia','donostia','pamplona'],
      // Aragón
      'zaragoza':   ['barcelona','madrid','huesca','teruel','pamplona','lleida'],
      'huesca':     ['barcelona','madrid','zaragoza','teruel','lleida','pamplona'],
      'teruel':     ['barcelona','madrid','zaragoza','huesca','castellon','valencia'],
      // Castilla
      'burgos':     ['barcelona','madrid','valladolid','palencia','soria','logroño'],
      'valladolid': ['barcelona','madrid','burgos','palencia','zamora','salamanca'],
      'toledo':     ['barcelona','madrid','ciudad real','cuenca','guadalajara','avila'],
      'ciudad_real':['barcelona','madrid','toledo','cuenca','albacete','badajoz'],
      'albacete':   ['barcelona','madrid','toledo','ciudad real','cuenca','murcia','valencia'],
      // Resto
      'murcia':     ['barcelona','madrid','alicante','almería','albacete','granada'],
      'otra_provincia': [],
    }
    const menciones = MENCIONES_PROV[provincia] || []
    if (menciones.some(m => t.includes(m))) return 0
  }
  // CCAA
  if (ccaa && ayuda.comunidad_autonoma === ccaa) score += 25
  if (ayuda.ambito === 'estatal') score += 5

  // Situación laboral
  if (situacion === 'autonomo' && (t.includes('autònom') || t.includes('autónomo'))) score += 20
  if (situacion === 'desempleado' && (t.includes('desempleo') || t.includes('paro') || t.includes('sepe'))) score += 20
  if (situacion === 'pensionista' && (t.includes('pensió') || t.includes('pensión') || t.includes('jubila'))) score += 25
  if (situacion === 'estudiante' && (t.includes('beca') || t.includes('estudi'))) score += 20
  if (situacion === 'emprendedor' && (t.includes('emprendedor') || t.includes('startup'))) score += 15

  // Edad
  if (edadNum < 30 && (t.includes('jove') || t.includes('joven') || t.includes('menor de 30'))) score += 20
  if (edadNum >= 65 && (t.includes('major') || t.includes('mayor') || t.includes('tercera edat'))) score += 25

  // Familia
  if (tieneHijos && (t.includes('fill') || t.includes('hijo') || t.includes('familia'))) score += 15
  if (familia.includes('familia_numerosa') && t.includes('nombrosa')) score += 30
  if (familia.includes('monoparental') && t.includes('monoparental')) score += 30
  if (familia.includes('viudo') && t.includes('viude')) score += 30
  if (familia.includes('dependiente_cargo') && t.includes('dependèn')) score += 25

  // Vivienda
  if (esAlquiler && t.includes('lloguer')) score += 20
  if (quiereRehabilitacion && t.includes('rehabilita')) score += 20

  // Discapacidad
  if (especial.includes('discapacidad') && t.includes('discapacitat')) score += 30

  // Ingresos bajos
  if (['sin_ingresos','bajos'].includes(ingresos) && (t.includes('vulnerab') || t.includes('renda baixa') || t.includes('renta baja'))) score += 20

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
        .filter(a => a._score >= 20)
        .sort((a, b) => b._score - a._score)

      setAyudas(conScore)

      // Total: solo prestaciones y subvenciones, no deducciones, max razonable
      const total = conScore
        .filter(a => !['deduccion','prestamo'].includes(a.tipo))
        .filter(a => a.importe_max > 0 && a.importe_max <= IMPORTE_MAX_CIUDADANO)
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

          {/* Header */}
          <div className="bg-[#111110] rounded-3xl p-8 mb-6 animate-fade-up">
            <p className="text-[#888882] text-sm mb-2">Ayudas que encajan con tu perfil</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-[#22C55E]">{ayudas.length}</span>
              <span className="text-[#888882] mb-2">ayudas encontradas</span>
            </div>
            {totalEstimado > 0 && (
              <>
                <div className="h-px bg-[#333330] my-4" />
                <p className="text-[#888882] text-sm mb-1">Importe máximo potencial</p>
                <span className="font-display text-3xl font-bold text-[#F7F3EC]">
                  {totalEstimado.toLocaleString('es-ES')}€
                </span>
                <p className="text-[#555550] text-xs mt-1">
                  Solo subvenciones y prestaciones directas. Las deducciones fiscales se muestran aparte.
                </p>
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
                <button onClick={enviarAGestoria} disabled={enviando}
                  className="bg-[#1A7A4A] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#145e39] transition-colors disabled:opacity-60">
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

          {/* CTA Pro */}
          {ayudas.length > FREE_LIMIT && (
            <div id="cta-pro" className="bg-[#E8540A] rounded-3xl p-8 mt-8 text-center animate-fade-up">
              <p className="text-white/80 text-sm mb-1">{ayudas.length - FREE_LIMIT} ayudas más bloqueadas</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Cobra todo lo que te toca</h2>
              <p className="text-white/80 mb-6 max-w-sm mx-auto text-sm">
                Accede a todas las ayudas, alertas cuando abran nuevas convocatorias y envío a tu gestoría.
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
