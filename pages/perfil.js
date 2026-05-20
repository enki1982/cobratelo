import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

const PASOS = [
  {
    id: 'situacion',
    titulo: '¿Cuál es tu situación laboral?',
    subtitulo: 'Selecciona la que mejor te describe',
    multi: false,
    opciones: [
      { value: 'autonomo', label: 'Autónomo / Freelance', emoji: '💼' },
      { value: 'empleado', label: 'Empleado por cuenta ajena', emoji: '👔' },
      { value: 'desempleado', label: 'En paro / Buscando trabajo', emoji: '🔍' },
      { value: 'pensionista', label: 'Pensionista / Jubilado', emoji: '🏖️' },
      { value: 'estudiante', label: 'Estudiante', emoji: '📚' },
      { value: 'emprendedor', label: 'Quiero emprender / crear empresa', emoji: '🚀' },
    ],
  },
  {
    id: 'edad',
    titulo: '¿Cuántos años tienes?',
    subtitulo: 'La edad determina muchas ayudas',
    multi: false,
    opciones: [
      { value: 'menor30', label: 'Menos de 30 años', emoji: '🌱' },
      { value: '30_45', label: 'Entre 30 y 45 años', emoji: '⚡' },
      { value: '45_65', label: 'Entre 45 y 65 años', emoji: '🎯' },
      { value: 'mayor65', label: 'Más de 65 años', emoji: '🌟' },
    ],
  },
  {
    id: 'familia',
    titulo: '¿Cuál es tu situación familiar?',
    subtitulo: 'Selecciona todo lo que aplique',
    multi: true,
    opciones: [
      { value: 'hijos_menores3', label: 'Hijos menores de 3 años', emoji: '👶' },
      { value: 'hijos_3_18', label: 'Hijos entre 3 y 18 años', emoji: '🧒' },
      { value: 'familia_numerosa', label: 'Familia numerosa (3+ hijos)', emoji: '👨‍👩‍👧‍👦' },
      { value: 'monoparental', label: 'Familia monoparental', emoji: '💪' },
      { value: 'viudo', label: 'Viudo/a', emoji: '🕊️' },
      { value: 'divorciado', label: 'Divorciado/a o separado/a', emoji: '⚖️' },
      { value: 'dependiente_cargo', label: 'Persona mayor o dependiente a cargo', emoji: '🤝' },
      { value: 'embarazada', label: 'Embarazada o en proceso de adopción', emoji: '🤱' },
      { value: 'sin_cargas', label: 'Sin cargas familiares', emoji: '✌️' },
    ],
  },
  {
    id: 'vivienda',
    titulo: '¿Cuál es tu situación de vivienda?',
    subtitulo: 'La vivienda activa muchos tipos de ayuda',
    multi: false,
    opciones: [
      { value: 'alquiler', label: 'Vivo de alquiler', emoji: '🏠' },
      { value: 'propietario', label: 'Tengo vivienda en propiedad', emoji: '🏡' },
      { value: 'hipoteca', label: 'Tengo hipoteca', emoji: '🏦' },
      { value: 'busco_vivienda', label: 'Busco vivienda o quiero comprar', emoji: '🔑' },
      { value: 'rehabilitacion', label: 'Quiero rehabilitar o reformar', emoji: '🔨' },
      { value: 'sin_vivienda', label: 'Sin vivienda estable', emoji: '⚠️' },
    ],
  },
  {
    id: 'ingresos',
    titulo: '¿Cuáles son tus ingresos anuales aproximados?',
    subtitulo: 'Muchas ayudas tienen límite de renta',
    multi: false,
    opciones: [
      { value: 'sin_ingresos', label: 'Sin ingresos o muy bajos (< 8.000€)', emoji: '📉' },
      { value: 'bajos', label: 'Bajos — entre 8.000€ y 15.000€', emoji: '💰' },
      { value: 'medios', label: 'Medios — entre 15.000€ y 30.000€', emoji: '💰💰' },
      { value: 'altos', label: 'Altos — más de 30.000€', emoji: '💰💰💰' },
    ],
  },
  {
    id: 'especial',
    titulo: '¿Alguna de estas situaciones te describe?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: true,
    opciones: [
      { value: 'discapacidad', label: 'Tengo certificado de discapacidad', emoji: '♿' },
      { value: 'dependencia', label: 'Tengo reconocida dependencia', emoji: '🤲' },
      { value: 'victima_violencia', label: 'Víctima de violencia de género', emoji: '🛡️' },
      { value: 'inmigrante', label: 'Soy inmigrante o refugiado', emoji: '🌍' },
      { value: 'rural', label: 'Vivo en zona rural o municipio pequeño', emoji: '🌾' },
      { value: 'ninguna', label: 'Ninguna de las anteriores', emoji: '✅' },
    ],
  },
  {
    id: 'vehiculo',
    titulo: '¿Tienes o quieres tener vehículo?',
    subtitulo: 'Hay ayudas para compra, renovación y combustible',
    multi: true,
    opciones: [
      { value: 'coche_gasolina', label: 'Tengo coche de gasolina o diésel', emoji: '🚗' },
      { value: 'coche_electrico', label: 'Tengo o quiero coche eléctrico/híbrido', emoji: '⚡' },
      { value: 'moto', label: 'Tengo moto', emoji: '🏍️' },
      { value: 'quiero_vehiculo', label: 'Quiero comprar un vehículo nuevo', emoji: '🛒' },
      { value: 'sin_vehiculo', label: 'No tengo ni necesito vehículo', emoji: '🚶' },
    ],
  },
  {
    id: 'extras',
    titulo: '¿Algo más que aplique a tu situación?',
    subtitulo: 'Puede haber ayudas que no imaginas',
    multi: true,
    opciones: [
      { value: 'mascotas', label: 'Tengo mascotas (perro, gato...)', emoji: '🐾' },
      { value: 'energia', label: 'Quiero mejorar la eficiencia energética de mi hogar', emoji: '☀️' },
      { value: 'salud_cronica', label: 'Tengo enfermedad crónica o uso medicación habitual', emoji: '💊' },
      { value: 'gafas_audifonos', label: 'Necesito gafas, audífonos o prótesis', emoji: '👓' },
      { value: 'estudios_hijos', label: 'Tengo hijos en edad escolar o universitaria', emoji: '🎓' },
      { value: 'negocio_digital', label: 'Tengo negocio y quiero digitalizarlo', emoji: '💻' },
      { value: 'pyme', label: 'Tengo empresa o pyme', emoji: '🏢' },
      { value: 'ninguno', label: 'Nada de lo anterior', emoji: '✅' },
    ],
  },
  {
    id: 'ccaa',
    titulo: '¿En qué comunidad autónoma vives?',
    subtitulo: 'Para incluir también ayudas autonómicas',
    multi: false,
    opciones: [
      { value: 'Catalunya', label: 'Cataluña', emoji: '🔴' },
      { value: 'Madrid', label: 'Madrid', emoji: '🏛️' },
      { value: 'Andalucía', label: 'Andalucía', emoji: '☀️' },
      { value: 'Valencia', label: 'Comunidad Valenciana', emoji: '🟡' },
      { value: 'Galicia', label: 'Galicia', emoji: '💚' },
      { value: 'Euskadi', label: 'País Vasco', emoji: '⚪' },
      { value: 'Aragón', label: 'Aragón', emoji: '🟡' },
      { value: 'Castilla', label: 'Castilla y León / La Mancha', emoji: '🏰' },
      { value: 'otra', label: 'Otra comunidad', emoji: '📍' },
    ],
  },
  {
    id: 'gestoria',
    titulo: '¿Tienes gestoría o asesor?',
    subtitulo: 'Podemos enviarles tu informe para que te ayuden a tramitar',
    multi: false,
    opciones: [
      { value: 'si_gestoria', label: 'Sí, tengo gestoría', emoji: '📋' },
      { value: 'no_gestoria', label: 'No tengo gestoría', emoji: '🙋' },
      { value: 'quiero_gestoria', label: 'No tengo pero me interesaría una', emoji: '🤝' },
    ],
  },
]

export default function Perfil() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [perfil, setPerfil] = useState({})
  const [seleccion, setSeleccion] = useState([])
  const [emailGestoria, setEmailGestoria] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  const pasoActual = PASOS[paso]
  const progreso = Math.round(((paso + 1) / PASOS.length) * 100)
  const esUltimoPaso = paso + 1 >= PASOS.length

  const toggleOpcion = (value) => {
    if (pasoActual.multi) {
      setSeleccion(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
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

  const siguiente = () => {
    const nuevoPerfil = {
      ...perfil,
      [pasoActual.id]: seleccion,
      ...(pasoActual.id === 'gestoria' && emailGestoria ? { email_gestoria: emailGestoria } : {})
    }
    setPerfil(nuevoPerfil)
    setSeleccion([])
    setShowEmailInput(false)

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
      setSeleccion(perfil[PASOS[paso - 1].id] || [])
      setShowEmailInput(false)
    }
  }

  const puedeAvanzar = seleccion.length > 0 && (
    !showEmailInput || emailGestoria.includes('@')
  )

  return (
    <>
      <Head>
        <title>Tu perfil — Cobratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
          <span className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </span>
          <span className="text-sm text-[#888882]">{paso + 1} / {PASOS.length}</span>
        </div>

        <div className="h-1 bg-[#E0DAD0] w-full">
          <div className="h-full bg-[#1A7A4A] transition-all duration-500" style={{ width: `${progreso}%` }} />
        </div>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#111110] mb-2">
              {pasoActual.titulo}
            </h1>
            <p className="text-[#888882] mb-8">{pasoActual.subtitulo}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {pasoActual.opciones.map((op, i) => {
              const selected = seleccion.includes(op.value)
              return (
                <button
                  key={op.value}
                  onClick={() => toggleOpcion(op.value)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150
                    ${selected
                      ? 'border-[#1A7A4A] bg-[#E8F5EE] text-[#111110]'
                      : 'border-[#E0DAD0] bg-white text-[#111110] hover:border-[#C0BAB0]'
                    }`}
                >
                  <span className="text-2xl">{op.emoji}</span>
                  <span className="font-medium text-sm leading-tight flex-1">{op.label}</span>
                  {selected && <span className="text-[#1A7A4A] font-bold text-lg">✓</span>}
                </button>
              )
            })}
          </div>

          {showEmailInput && (
            <div className="mb-6 animate-fade-up">
              <label className="block text-sm font-medium text-[#111110] mb-2">
                Email de tu gestoría
              </label>
              <input
                type="email"
                value={emailGestoria}
                onChange={e => setEmailGestoria(e.target.value)}
                placeholder="gestor@ejemplo.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] font-medium transition-colors"
              />
              <p className="text-xs text-[#888882] mt-2">
                Les enviaremos tu informe de ayudas para que puedan tramitarlas por ti.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            {paso > 0 && (
              <button onClick={anterior}
                className="px-6 py-3.5 rounded-full border border-[#E0DAD0] text-[#888882] font-medium hover:border-[#C0BAB0] transition-colors">
                ← Atrás
              </button>
            )}
            <button
              onClick={siguiente}
              disabled={!puedeAvanzar}
              className={`flex-1 py-3.5 rounded-full font-semibold transition-all duration-200
                ${puedeAvanzar
                  ? 'bg-[#111110] text-[#F7F3EC] hover:bg-[#333330]'
                  : 'bg-[#E0DAD0] text-[#B0AAA0] cursor-not-allowed'
                }`}
            >
              {esUltimoPaso ? 'Ver mis ayudas →' : 'Continuar →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
