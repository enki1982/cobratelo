import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

const PASOS = [
  {
    id: 'situacion',
    titulo: '¿Cuál es tu situación laboral?',
    subtitulo: 'Selecciona todas las que apliquen',
    multi: false,
    opciones: [
      { value: 'autonomo', label: 'Autónomo / Freelance', emoji: '💼' },
      { value: 'empleado', label: 'Trabajador por cuenta ajena', emoji: '👔' },
      { value: 'desempleado', label: 'En paro / Buscando trabajo', emoji: '🔍' },
      { value: 'pensionista', label: 'Pensionista / Jubilado', emoji: '🏖️' },
      { value: 'estudiante', label: 'Estudiante', emoji: '📚' },
      { value: 'emprendedor', label: 'Quiero emprender', emoji: '🚀' },
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
    titulo: '¿Tienes hijos o dependientes a cargo?',
    subtitulo: 'Selecciona todo lo que aplique',
    multi: true,
    opciones: [
      { value: 'hijos_menores', label: 'Hijos menores de 3 años', emoji: '👶' },
      { value: 'hijos_3_18', label: 'Hijos entre 3 y 18 años', emoji: '🧒' },
      { value: 'familia_numerosa', label: 'Familia numerosa (3+ hijos)', emoji: '👨‍👩‍👧‍👦' },
      { value: 'monoparental', label: 'Familia monoparental', emoji: '💪' },
      { value: 'dependiente', label: 'Persona dependiente a cargo', emoji: '🤝' },
      { value: 'sin_hijos', label: 'Sin hijos ni dependientes', emoji: '✌️' },
    ],
  },
  {
    id: 'vivienda',
    titulo: '¿Cuál es tu situación de vivienda?',
    subtitulo: 'Tu vivienda determina varios tipos de ayuda',
    multi: false,
    opciones: [
      { value: 'alquiler', label: 'Vivo de alquiler', emoji: '🏠' },
      { value: 'propietario', label: 'Tengo vivienda en propiedad', emoji: '🏡' },
      { value: 'hipoteca', label: 'Tengo hipoteca', emoji: '🏦' },
      { value: 'busco_vivienda', label: 'Busco vivienda / quiero comprar', emoji: '🔑' },
      { value: 'sin_vivienda', label: 'Sin vivienda propia ni alquiler', emoji: '⚠️' },
    ],
  },
  {
    id: 'ingresos',
    titulo: '¿Cuáles son tus ingresos anuales aproximados?',
    subtitulo: 'Muchas ayudas tienen límite de ingresos',
    multi: false,
    opciones: [
      { value: 'sin_ingresos', label: 'Sin ingresos o muy bajos (< 8.000€)', emoji: '📉' },
      { value: 'bajos', label: 'Bajos (8.000€ – 15.000€)', emoji: '💰' },
      { value: 'medios', label: 'Medios (15.000€ – 30.000€)', emoji: '💰💰' },
      { value: 'altos', label: 'Altos (> 30.000€)', emoji: '💰💰💰' },
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
      { value: 'pyme', label: 'Tengo una empresa o pyme', emoji: '🏢' },
      { value: 'rural', label: 'Vivo en zona rural', emoji: '🌾' },
      { value: 'ninguna', label: 'Ninguna de las anteriores', emoji: '✅' },
    ],
  },
  {
    id: 'ccaa',
    titulo: '¿En qué comunidad autónoma vives?',
    subtitulo: 'Para mostrarte también ayudas autonómicas',
    multi: false,
    opciones: [
      { value: 'Catalunya', label: 'Cataluña', emoji: '🔴' },
      { value: 'Madrid', label: 'Madrid', emoji: '🏛️' },
      { value: 'Andalucía', label: 'Andalucía', emoji: '☀️' },
      { value: 'Valencia', label: 'Comunidad Valenciana', emoji: '🟡' },
      { value: 'Galicia', label: 'Galicia', emoji: '💚' },
      { value: 'Euskadi', label: 'País Vasco', emoji: '⚪' },
      { value: 'otra', label: 'Otra comunidad', emoji: '📍' },
    ],
  },
]

export default function Perfil() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [perfil, setPerfil] = useState({})
  const [seleccion, setSeleccion] = useState([])

  const pasoActual = PASOS[paso]
  const progreso = Math.round(((paso + 1) / PASOS.length) * 100)

  const toggleOpcion = (value) => {
    if (pasoActual.multi) {
      setSeleccion(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
    } else {
      setSeleccion([value])
    }
  }

  const siguiente = () => {
    const nuevoPerfil = { ...perfil, [pasoActual.id]: seleccion }
    setPerfil(nuevoPerfil)
    setSeleccion([])

    if (paso + 1 >= PASOS.length) {
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
    }
  }

  return (
    <>
      <Head>
        <title>Tu perfil — Cobratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
          <span className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </span>
          <span className="text-sm text-[#888882]">{paso + 1} / {PASOS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#E0DAD0] w-full">
          <div
            className="h-full bg-[#1A7A4A] transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#111110] mb-2">
              {pasoActual.titulo}
            </h1>
            <p className="text-[#888882] mb-8">{pasoActual.subtitulo}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {pasoActual.opciones.map((op, i) => {
              const selected = seleccion.includes(op.value)
              return (
                <button
                  key={op.value}
                  onClick={() => toggleOpcion(op.value)}
                  className={`
                    flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150
                    animate-fade-up delay-${Math.min(i * 100, 500)}
                    ${selected
                      ? 'border-[#1A7A4A] bg-[#E8F5EE] text-[#111110]'
                      : 'border-[#E0DAD0] bg-white text-[#111110] hover:border-[#C0BAB0]'
                    }
                  `}
                >
                  <span className="text-2xl">{op.emoji}</span>
                  <span className="font-medium text-sm leading-tight">{op.label}</span>
                  {selected && (
                    <span className="ml-auto text-[#1A7A4A] font-bold text-lg">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-auto">
            {paso > 0 && (
              <button
                onClick={anterior}
                className="px-6 py-3.5 rounded-full border border-[#E0DAD0] text-[#888882] font-medium hover:border-[#C0BAB0] transition-colors"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={siguiente}
              disabled={seleccion.length === 0}
              className={`
                flex-1 py-3.5 rounded-full font-semibold transition-all duration-200
                ${seleccion.length > 0
                  ? 'bg-[#111110] text-[#F7F3EC] hover:bg-[#333330]'
                  : 'bg-[#E0DAD0] text-[#B0AAA0] cursor-not-allowed'
                }
              `}
            >
              {paso + 1 >= PASOS.length ? 'Ver mis ayudas →' : 'Continuar →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
