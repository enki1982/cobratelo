import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

// ── INCOMPATIBILIDADES ───────────────────────────────────────────────────────
const INCOMPATIBLES = {
  // Situación laboral
  'empleado':     ['desempleado','pensionista'],
  'autonomo':     ['desempleado','pensionista'],
  'desempleado':  ['empleado','autonomo','pensionista','emprendedor'],
  'pensionista':  ['empleado','autonomo','desempleado','estudiante','emprendedor'],
  'estudiante':   ['pensionista','desempleado'],
  'emprendedor':  ['desempleado','pensionista'],
  // Estado civil — solo uno
  'soltero':      ['casado','divorciado','viudo'],
  'casado':       ['soltero','divorciado','viudo','monoparental'],
  'divorciado':   ['casado','soltero','viudo'],
  'viudo':        ['casado','soltero','divorciado'],
  // Cargas familiares
  'sin_cargas':   ['hijos_menores3','hijos_3_18','familia_numerosa','monoparental','embarazada','dependiente_cargo'],
  'hijos_menores3':    ['sin_cargas'],
  'hijos_3_18':        ['sin_cargas'],
  'familia_numerosa':  ['sin_cargas','soltero'],
  'monoparental':      ['casado','sin_cargas'],
  'embarazada':        ['sin_cargas'],
  'dependiente_cargo': ['sin_cargas'],
  // Vivienda
  'sin_vivienda':   ['alquiler','propietario','hipoteca','busco_vivienda','rehabilitacion'],
  'alquiler':       ['sin_vivienda'],
  'propietario':    ['sin_vivienda'],
  'hipoteca':       ['sin_vivienda'],
  'busco_vivienda': ['sin_vivienda'],
  'rehabilitacion': ['sin_vivienda'],
  // Especiales
  'ninguna':           ['discapacidad','dependencia','victima_violencia','inmigrante','rural'],
  'discapacidad':      ['ninguna'],
  'dependencia':       ['ninguna'],
  'victima_violencia': ['ninguna'],
  'inmigrante':        ['ninguna'],
  'rural':             ['ninguna'],
  // Vehículo
  'sin_vehiculo':    ['coche_gasolina','coche_electrico','moto'],
  'coche_gasolina':  ['sin_vehiculo'],
  'coche_electrico': ['sin_vehiculo'],
  'moto':            ['sin_vehiculo'],
  // Extras
  'ninguno':         ['mascotas','energia','salud_cronica','gafas_audifonos','estudios_hijos','negocio_digital','pyme'],
  'mascotas':        ['ninguno'],
  'energia':         ['ninguno'],
  'salud_cronica':   ['ninguno'],
  'gafas_audifonos': ['ninguno'],
  'estudios_hijos':  ['ninguno'],
  'negocio_digital': ['ninguno'],
  'pyme':            ['ninguno'],
}

const PASOS = [
  {
    id: 'situacion',
    titulo: '¿Cuál es tu situación laboral?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: true,
    opciones: [
      { value: 'empleado',    label: 'Empleado/a por cuenta ajena', emoji: '👔' },
      { value: 'autonomo',    label: 'Autónomo/a o freelance',      emoji: '💼' },
      { value: 'desempleado', label: 'En paro / Buscando trabajo',  emoji: '🔍' },
      { value: 'pensionista', label: 'Pensionista / Jubilado/a',    emoji: '🏖️' },
      { value: 'estudiante',  label: 'Estudiante',                  emoji: '📚' },
      { value: 'emprendedor', label: 'Quiero emprender / crear empresa', emoji: '🚀' },
    ],
  },
  {
    id: 'nacimiento',
    titulo: '¿Cuándo naciste?',
    subtitulo: 'Usamos tu fecha para calcular ayudas por edad y avisarte cuando cambien al cumplir años',
    multi: false,
    tipo: 'fecha',
    opciones: [],
  },
  {
    id: 'familia',
    titulo: '¿Cuál es tu situación familiar?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: true,
    opciones: [
      { value: 'soltero',           label: 'Soltero/a',                         emoji: '🙋' },
      { value: 'casado',            label: 'Casado/a o pareja de hecho',        emoji: '💍' },
      { value: 'divorciado',        label: 'Divorciado/a o separado/a',         emoji: '⚖️' },
      { value: 'viudo',             label: 'Viudo/a',                           emoji: '🕊️' },
      { value: 'hijos_menores3',    label: 'Hijos menores de 3 años',           emoji: '👶' },
      { value: 'hijos_3_18',        label: 'Hijos entre 3 y 18 años',           emoji: '🧒' },
      { value: 'familia_numerosa',  label: 'Familia numerosa (3+ hijos)',        emoji: '👨‍👩‍👧‍👦' },
      { value: 'monoparental',      label: 'Familia monoparental',              emoji: '💪' },
      { value: 'embarazada',        label: 'Embarazada o en proceso de adopción', emoji: '🤱' },
      { value: 'dependiente_cargo', label: 'Persona mayor o dependiente a cargo', emoji: '🤝' },
      { value: 'sin_cargas',        label: 'Sin cargas familiares',             emoji: '✌️' },
    ],
  },
  {
    id: 'vivienda',
    titulo: '¿Cuál es tu situación de vivienda?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: true,
    opciones: [
      { value: 'alquiler',      label: 'Vivo de alquiler',                     emoji: '🏠' },
      { value: 'propietario',   label: 'Tengo vivienda en propiedad',          emoji: '🏡' },
      { value: 'hipoteca',      label: 'Tengo hipoteca',                       emoji: '🏦' },
      { value: 'busco_vivienda',label: 'Busco vivienda o quiero comprar',      emoji: '🔑' },
      { value: 'rehabilitacion',label: 'Quiero rehabilitar o reformar',        emoji: '🔨' },
      { value: 'sin_vivienda',  label: 'Sin vivienda estable',                 emoji: '⚠️' },
    ],
  },
  {
    id: 'ingresos',
    titulo: '¿Cuáles son tus ingresos anuales aproximados?',
    subtitulo: 'Muchas ayudas tienen límite de renta',
    multi: false,
    opciones: [
      { value: 'sin_ingresos', label: 'Sin ingresos o muy bajos (< 8.000€)',    emoji: '📉' },
      { value: 'bajos',        label: 'Entre 8.000€ y 15.000€',                emoji: '💰' },
      { value: 'medios',       label: 'Entre 15.000€ y 30.000€',               emoji: '💰💰' },
      { value: 'altos',        label: 'Más de 30.000€',                        emoji: '💰💰💰' },
    ],
  },
  {
    id: 'especial',
    titulo: '¿Alguna de estas situaciones te describe?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: true,
    opciones: [
      { value: 'discapacidad',     label: 'Tengo certificado de discapacidad', emoji: '♿' },
      { value: 'dependencia',      label: 'Tengo reconocida dependencia',      emoji: '🤲' },
      { value: 'victima_violencia',label: 'Víctima de violencia de género',    emoji: '🛡️' },
      { value: 'inmigrante',       label: 'Soy inmigrante o refugiado',        emoji: '🌍' },
      { value: 'ninguna',          label: 'Ninguna de las anteriores',         emoji: '✅' },
    ],
  },
  {
    id: 'vehiculo',
    titulo: '¿Tienes o quieres tener vehículo?',
    subtitulo: 'Hay ayudas para compra, renovación y combustible',
    multi: true,
    opciones: [
      { value: 'coche_gasolina',  label: 'Tengo coche de gasolina o diésel',       emoji: '🚗' },
      { value: 'coche_electrico', label: 'Tengo o quiero coche eléctrico/híbrido', emoji: '⚡' },
      { value: 'moto',            label: 'Tengo moto',                             emoji: '🏍️' },
      { value: 'quiero_vehiculo', label: 'Quiero comprar un vehículo nuevo',        emoji: '🛒' },
      { value: 'sin_vehiculo',    label: 'No tengo ni necesito vehículo',           emoji: '🚶' },
    ],
  },
  {
    id: 'extras',
    titulo: '¿Algo más que aplique a tu situación?',
    subtitulo: 'Puede haber ayudas que no imaginas',
    multi: true,
    tipo: 'extras_filtrado',
    opciones: [
      { value: 'mascotas',        label: 'Tengo mascotas (perro, gato...)',              emoji: '🐾', excluir_si: [] },
      { value: 'energia',         label: 'Quiero mejorar la eficiencia energética',      emoji: '☀️', excluir_si: [] },
      { value: 'salud_cronica',   label: 'Tengo enfermedad crónica o uso medicación',    emoji: '💊', excluir_si: [] },
      { value: 'gafas_audifonos', label: 'Necesito gafas, audífonos o prótesis',         emoji: '👓', excluir_si: [] },
      { value: 'estudios_hijos',  label: 'Tengo hijos en edad escolar o universitaria',  emoji: '🎓', excluir_si: [] },
      { value: 'negocio_digital', label: 'Tengo negocio y quiero digitalizarlo',         emoji: '💻', excluir_si: ['desempleado'] },
      { value: 'pyme',            label: 'Tengo empresa o pyme',                         emoji: '🏢', excluir_si: ['desempleado'] },
      { value: 'ninguno',         label: 'Nada de lo anterior',                          emoji: '✅', excluir_si: [] },
    ],
  },
  {
    id: 'pueblo',
    titulo: '¿En qué población vives?',
    subtitulo: 'Escribe tu pueblo o ciudad para encontrar ayudas locales',
    multi: false,
    tipo: 'pueblo',
    opciones: [],
  },
  {
    id: 'empadronamiento',
    titulo: '¿Estás empadronado/a en esa población?',
    subtitulo: 'El empadronamiento determina qué ayudas municipales puedes solicitar',
    multi: false,
    opciones: [
      { value: 'empadronado_si',  label: 'Sí, estoy empadronado/a aquí',          emoji: '✅' },
      { value: 'empadronado_no',  label: 'No, estoy empadronado/a en otro lugar', emoji: '📍' },
    ],
  },
  {
    id: 'pueblo_empadron',
    titulo: '¿En qué población estás empadronado/a?',
    subtitulo: 'Las ayudas municipales dependen del padrón municipal',
    multi: false,
    tipo: 'pueblo',
    opciones: [],
    condicion: (perfil) => (perfil.empadronamiento || [])[0] === 'empadronado_no',
  },
  {
    id: 'gestoria',
    titulo: '¿Tienes gestoría o asesor?',
    subtitulo: 'Podemos enviarles tu informe para que te ayuden a tramitar',
    multi: false,
    opciones: [
      { value: 'si_gestoria',     label: 'Sí, tengo gestoría',                      emoji: '📋' },
      { value: 'no_gestoria',     label: 'No tengo gestoría',                       emoji: '🙋' },
      { value: 'quiero_gestoria', label: 'No tengo pero me interesaría una',        emoji: '🤝' },
    ],
  },
]

// Buscar municipios via Nominatim (OpenStreetMap) - gratis, sin API key
async function buscarMunicipio(query) {
  if (query.length < 2) return []
  try {
    // Búsqueda amplia sin filtro de tipo — incluye municipios pequeños, aldeas, barrios
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},+España&format=json&limit=12&addressdetails=1&accept-language=es`
    const r = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'Cobratelo.es/1.0 (hola@cobratelo.es)'
      }
    })
    const data = await r.json()
    return data
      .filter(d => {
        if (!d.address) return false
        // Excluir resultados que no sean lugares habitados (carreteras, edificios, etc.)
        const excluir = ['road','motorway','path','cycleway','footway','building','house','shop','amenity','tourism']
        if (excluir.includes(d.type)) return false
        // Solo España
        if (d.address.country_code && d.address.country_code !== 'es') return false
        return true
      })
      .map(d => ({
        nombre: d.address.municipality || d.address.city || d.address.town ||
                d.address.village || d.address.hamlet || d.address.suburb || d.name,
        provincia: d.address.province || d.address.county || '',
        ccaa: d.address.state || '',
        comarca: d.address.county || d.address.state_district || '',
        display: d.display_name.split(',').slice(0, 3).join(', '),
      }))
      .filter(d => d.nombre && d.nombre.length > 0)
      .filter((v, i, a) => a.findIndex(t =>
        t.nombre.toLowerCase() === v.nombre.toLowerCase() && t.provincia === v.provincia
      ) === i)
      .slice(0, 7)
  } catch (e) {
    return []
  }
}

// Componente de input de pueblo con autocompletado
function PuebloInput({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value?.nombre || '')
  const [sugerencias, setSugerencias] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(!!value?.nombre)
  const timerRef = useRef(null)

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setSeleccionado(false)
    onChange(null)
    clearTimeout(timerRef.current)
    if (q.length >= 2) {
      setBuscando(true)
      timerRef.current = setTimeout(async () => {
        const res = await buscarMunicipio(q)
        setSugerencias(res)
        setBuscando(false)
      }, 400)
    } else {
      setSugerencias([])
      setBuscando(false)
    }
  }

  const handleSelect = (mun) => {
    setQuery(mun.nombre)
    setSugerencias([])
    setSeleccionado(true)
    onSelect(mun)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Escribe tu pueblo o ciudad..."
        className={`w-full px-4 py-4 rounded-2xl border-2 text-[#111110] font-medium text-lg focus:outline-none transition-colors
          ${seleccionado ? 'border-[#1A7A4A] bg-[#E8F5EE]' : 'border-[#E0DAD0] bg-white focus:border-[#1A7A4A]'}`}
      />
      {buscando && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {seleccionado && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A7A4A] text-xl font-bold">✓</div>
      )}
      {sugerencias.length > 0 && !seleccionado && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-[#E0DAD0] rounded-2xl shadow-lg overflow-hidden">
          {sugerencias.map((mun, i) => (
            <button key={i} onClick={() => handleSelect(mun)}
              className="w-full text-left px-4 py-3 hover:bg-[#F7F3EC] transition-colors border-b border-[#F0EAE0] last:border-0">
              <span className="font-semibold text-[#111110]">{mun.nombre}</span>
              <span className="text-sm text-[#888882] ml-2">{mun.provincia}{mun.comarca && mun.comarca !== mun.provincia ? ` · ${mun.comarca}` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Perfil() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [perfil, setPerfil] = useState({})
  const [seleccion, setSeleccion] = useState([])
  const [fechaNac, setFechaNac] = useState('')
  const [pueblo, setPueblo] = useState(null)
  const [emailGestoria, setEmailGestoria] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  // Filtrar pasos según condiciones
  const pasosFiltrados = PASOS.filter(p => !p.condicion || p.condicion(perfil))
  const pasoActual = pasosFiltrados[paso]
  const progreso = Math.round(((paso + 1) / pasosFiltrados.length) * 100)
  const esUltimoPaso = paso + 1 >= pasosFiltrados.length

  // Filtrar opciones de extras según situación laboral
  const getOpciones = () => {
    if (!pasoActual) return []
    if (pasoActual.tipo === 'extras_filtrado') {
      const situaciones = perfil.situacion || []
      return pasoActual.opciones.filter(op =>
        !op.excluir_si || !op.excluir_si.some(s => situaciones.includes(s))
      )
    }
    return pasoActual.opciones
  }

  const toggleOpcion = (value) => {
    if (pasoActual.multi) {
      setSeleccion(prev => {
        if (prev.includes(value)) return prev.filter(v => v !== value)
        const incompatibles = INCOMPATIBLES[value] || []
        const sinIncompatibles = prev.filter(v => !incompatibles.includes(v))
        const filtrado = sinIncompatibles.filter(v => !(INCOMPATIBLES[v] || []).includes(value))
        return [...filtrado, value]
      })
    } else {
      setSeleccion([value])
      if (pasoActual.id === 'gestoria' && value === 'si_gestoria') {
        setShowEmailInput(true)
      } else {
        setShowEmailInput(false)
        setEmailGestoria('')
      }
    }
  }

  const getValorPaso = () => {
    if (pasoActual.tipo === 'fecha') return fechaNac ? [fechaNac] : []
    if (pasoActual.tipo === 'pueblo') return pueblo ? [JSON.stringify(pueblo)] : []
    return seleccion
  }

  const siguiente = () => {
    const valor = getValorPaso()
    const nuevoPerfil = {
      ...perfil,
      [pasoActual.id]: valor,
      ...(pasoActual.id === 'gestoria' && emailGestoria ? { email_gestoria: emailGestoria } : {}),
      // Si el paso es pueblo, guardar también CCAA, provincia, comarca derivados
      ...(pasoActual.id === 'pueblo' && pueblo ? {
        ccaa: [pueblo.ccaa],
        provincia: [pueblo.provinciaId || pueblo.provincia],
        comarca: [pueblo.comarca],
      } : {}),
      ...(pasoActual.id === 'pueblo_empadron' && pueblo ? {
        ccaa_empadron: [pueblo.ccaa],
        provincia_empadron: [pueblo.provinciaId || pueblo.provincia],
        comarca_empadron: [pueblo.comarca],
      } : {}),
    }
    setPerfil(nuevoPerfil)
    setSeleccion([])
    setPueblo(null)
    setShowEmailInput(false)

    // Marcar rural automáticamente basado en el pueblo
    // (pendiente: consultar API INE para población < 5000)

    if (esUltimoPaso) {
      const encoded = encodeURIComponent(JSON.stringify(nuevoPerfil))
      router.push(`/resultados?perfil=${encoded}`)
    } else {
      setPaso(paso + 1)
    }
  }

  const anterior = () => {
    if (paso > 0) {
      setPaso(paso - 1)
      const prevPaso = pasosFiltrados[paso - 1]
      if (prevPaso.tipo === 'fecha') {
        setFechaNac((perfil[prevPaso.id] || [''])[0] || '')
      } else if (prevPaso.tipo === 'pueblo') {
        try { setPueblo(JSON.parse((perfil[prevPaso.id] || ['{}'])[0])) } catch { setPueblo(null) }
      } else {
        setSeleccion(perfil[prevPaso.id] || [])
      }
      setShowEmailInput(false)
    }
  }

  // Calcular edad desde fecha de nacimiento
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return 0
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let edad = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const puedeAvanzar = () => {
    if (pasoActual.tipo === 'fecha') {
      const edad = calcularEdad(fechaNac)
      return fechaNac && edad >= 0 && edad <= 120
    }
    if (pasoActual.tipo === 'pueblo') return !!pueblo
    return seleccion.length > 0 && (!showEmailInput || emailGestoria.includes('@'))
  }

  if (!pasoActual) return null

  const fechaMaxNac = new Date()
  fechaMaxNac.setFullYear(fechaMaxNac.getFullYear() - 0)
  const fechaMinNac = new Date()
  fechaMinNac.setFullYear(fechaMinNac.getFullYear() - 120)

  return (
    <>
      <Head>
        <title>Tu perfil — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <span className="text-sm text-[#888882]">{paso + 1} / {pasosFiltrados.length}</span>
        </div>

        <div className="h-1 bg-[#E0DAD0] w-full">
          <div className="h-full bg-[#1A7A4A] transition-all duration-500" style={{ width: `${progreso}%` }} />
        </div>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#111110] mb-2">
            {pasoActual.titulo}
          </h1>
          <p className="text-[#888882] mb-8">{pasoActual.subtitulo}</p>

          {/* Input fecha nacimiento */}
          {pasoActual.tipo === 'fecha' && (
            <div className="mb-6">
              <input
                type="date"
                value={fechaNac}
                onChange={e => setFechaNac(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={fechaMinNac.toISOString().split('T')[0]}
                className="w-full px-4 py-4 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] font-medium text-lg transition-colors"
              />
              {fechaNac && (
                <p className="text-sm text-[#1A7A4A] mt-2 font-medium">
                  {calcularEdad(fechaNac)} años
                  {calcularEdad(fechaNac) >= 65 ? ' 🌟' : calcularEdad(fechaNac) < 30 ? ' 🌱' : ''}
                </p>
              )}
            </div>
          )}

          {/* Input pueblo */}
          {pasoActual.tipo === 'pueblo' && (
            <div className="mb-6">
              <PuebloInput
                value={pueblo}
                onChange={setPueblo}
                onSelect={(mun) => setPueblo(mun)}
              />
              {pueblo && (
                <div className="mt-3 p-3 bg-[#E8F5EE] rounded-xl text-sm">
                  <span className="font-medium text-[#1A7A4A]">{pueblo.ccaa}</span>
                  <span className="text-[#888882]"> · {pueblo.provincia}</span>
                  {pueblo.comarca && pueblo.comarca !== pueblo.provincia && (
                    <span className="text-[#888882]"> · {pueblo.comarca}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Opciones normales */}
          {!pasoActual.tipo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {getOpciones().map((op) => {
                const selected = seleccion.includes(op.value)
                return (
                  <button key={op.value} onClick={() => toggleOpcion(op.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150
                      ${selected
                        ? 'border-[#1A7A4A] bg-[#E8F5EE] text-[#111110]'
                        : 'border-[#E0DAD0] bg-white text-[#111110] hover:border-[#C0BAB0]'
                      }`}>
                    <span className="text-2xl">{op.emoji}</span>
                    <span className="font-medium text-sm leading-tight flex-1">{op.label}</span>
                    {selected && <span className="text-[#1A7A4A] font-bold text-lg">✓</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Extras con filtrado */}
          {pasoActual.tipo === 'extras_filtrado' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {getOpciones().map((op) => {
                const selected = seleccion.includes(op.value)
                return (
                  <button key={op.value} onClick={() => toggleOpcion(op.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150
                      ${selected
                        ? 'border-[#1A7A4A] bg-[#E8F5EE] text-[#111110]'
                        : 'border-[#E0DAD0] bg-white text-[#111110] hover:border-[#C0BAB0]'
                      }`}>
                    <span className="text-2xl">{op.emoji}</span>
                    <span className="font-medium text-sm leading-tight flex-1">{op.label}</span>
                    {selected && <span className="text-[#1A7A4A] font-bold text-lg">✓</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Email gestoría */}
          {showEmailInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#111110] mb-2">Email de tu gestoría</label>
              <input type="email" value={emailGestoria} onChange={e => setEmailGestoria(e.target.value)}
                placeholder="gestor@ejemplo.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] font-medium transition-colors" />
              <p className="text-xs text-[#888882] mt-2">Les enviaremos tu informe para que tramiten las ayudas por ti.</p>
            </div>
          )}

          {/* Botones navegación */}
          <div className="flex gap-3 mt-auto">
            {paso > 0 && (
              <button onClick={anterior}
                className="px-6 py-3.5 rounded-full border border-[#E0DAD0] text-[#888882] font-medium hover:border-[#C0BAB0] transition-colors">
                ← Atrás
              </button>
            )}
            <button onClick={siguiente} disabled={!puedeAvanzar()}
              className={`flex-1 py-3.5 rounded-full font-semibold transition-all duration-200
                ${puedeAvanzar()
                  ? 'bg-[#111110] text-[#F7F3EC] hover:bg-[#333330]'
                  : 'bg-[#E0DAD0] text-[#B0AAA0] cursor-not-allowed'
                }`}>
              {esUltimoPaso ? 'Ver mis ayudas →' : 'Continuar →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
