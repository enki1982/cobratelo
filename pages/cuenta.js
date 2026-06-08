import Head from 'next/head'
import { C, bgMesh, navStyle } from '../lib/theme'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const LABELS = {
  empleado:'Empleado/a',autonomo:'Autónomo/a',desempleado:'En paro',pensionista:'Pensionista',estudiante:'Estudiante',emprendedor:'Emprendedor/a',
  soltero:'Soltero/a',casado:'Casado/a o pareja',divorciado:'Divorciado/a',viudo:'Viudo/a',hijos_menores3:'Hijos < 3 años',hijos_3_18:'Hijos 3-18 años',familia_numerosa:'Familia numerosa',monoparental:'Monoparental',embarazada:'Embarazada/adopción',dependiente_cargo:'Dependiente a cargo',sin_cargas:'Sin cargas familiares',
  alquiler:'Alquiler',propietario:'Propiedad',hipoteca:'Hipoteca',busco_vivienda:'Buscando vivienda',rehabilitacion:'Quiere reformar',sin_vivienda:'Sin vivienda estable',
  alquiler_menos300:'< 300€/mes',alquiler_300_600:'300–600€/mes',alquiler_600_900:'600–900€/mes',alquiler_900_1200:'900–1.200€/mes',alquiler_mas1200:'> 1.200€/mes',
  alquiler_solo:'Solo/a',alquiler_pareja:'Con pareja/familia',alquiler_compis:'Piso compartido',
  sin_ingresos:'< 8.000€/año',bajos:'8.000–15.000€',medios:'15.000–30.000€',altos:'> 30.000€',
  discapacidad:'Discapacidad',dependencia:'Dependencia',victima_violencia:'Víctima violencia',inmigrante:'Inmigrante/refugiado',rural:'Zona rural',ninguna:'Ninguna',
  coche_gasolina:'Coche gasolina/diésel',coche_electrico:'Coche eléctrico/híbrido',moto:'Moto',quiero_vehiculo:'Quiere vehículo',sin_vehiculo:'Sin vehículo',
  mascotas:'Mascotas',energia:'Eficiencia energética',salud_cronica:'Enfermedad crónica',gafas_audifonos:'Gafas/audífonos',estudios_hijos:'Hijos en edad escolar',negocio_digital:'Digitalización negocio',pyme:'Empresa/pyme',ninguno:'Ninguno',
  si_gestoria:'Tiene gestoría',no_gestoria:'Sin gestoría',quiero_gestoria:'Quiere gestoría',
  mujer:'Mujer',hombre:'Hombre',otro:'Otro / No binario',nd:'Prefiero no decirlo',
  empadronado_si:'Sí',empadronado_no:'No (otro lugar)',
}

// Opciones para edición inline — igual que perfil.js
const OPCIONES_SECCION = {
  situacion: { multi: true, opts: [
    {v:'empleado',l:'Empleado/a',e:''},{v:'autonomo',l:'Autónomo/a',e:''},{v:'desempleado',l:'En paro',e:''},
    {v:'pensionista',l:'Pensionista',e:'️'},{v:'estudiante',l:'Estudiante',e:''},{v:'emprendedor',l:'Quiero emprender',e:''},
  ]},
  genero: { multi: false, opts: [
    {v:'mujer',l:'Mujer',e:''},{v:'hombre',l:'Hombre',e:''},{v:'otro',l:'Otro / No binario',e:''},{v:'nd',l:'Prefiero no decirlo',e:''},
  ]},
  familia: { multi: true, opts: [
    {v:'soltero',l:'Soltero/a',e:''},{v:'casado',l:'Casado/a o pareja',e:''},{v:'divorciado',l:'Divorciado/a',e:'️'},{v:'viudo',l:'Viudo/a',e:'️'},
    {v:'hijos_menores3',l:'Hijos < 3 años',e:''},{v:'hijos_3_18',l:'Hijos 3-18 años',e:''},{v:'familia_numerosa',l:'Familia numerosa',e:'‍‍‍'},
    {v:'monoparental',l:'Monoparental',e:''},{v:'embarazada',l:'Embarazada/adopción',e:''},{v:'dependiente_cargo',l:'Dependiente a cargo',e:''},{v:'sin_cargas',l:'Sin cargas',e:'️'},
  ]},
  vivienda: { multi: true, opts: [
    {v:'alquiler',l:'Vivo de alquiler',e:''},{v:'propietario',l:'Propiedad',e:''},{v:'hipoteca',l:'Hipoteca',e:''},
    {v:'busco_vivienda',l:'Buscando vivienda',e:''},{v:'rehabilitacion',l:'Quiero reformar',e:''},{v:'sin_vivienda',l:'Sin vivienda',e:'️'},
  ]},
  alquiler_detalle: { multi: false, condicion: p => (p.vivienda||[]).includes('alquiler'), opts: [
    {v:'alquiler_menos300',l:'< 300€/mes',e:''},{v:'alquiler_300_600',l:'300–600€/mes',e:''},
    {v:'alquiler_600_900',l:'600–900€/mes',e:''},{v:'alquiler_900_1200',l:'900–1.200€/mes',e:''},{v:'alquiler_mas1200',l:'> 1.200€/mes',e:''},
  ]},
  alquiler_compartido: { multi: false, condicion: p => (p.vivienda||[]).includes('alquiler'), opts: [
    {v:'alquiler_solo',l:'Solo/a',e:''},{v:'alquiler_pareja',l:'Con pareja/familia',e:''},{v:'alquiler_compis',l:'Piso compartido',e:''},
  ]},
  ingresos: { multi: false, opts: [
    {v:'sin_ingresos',l:'< 8.000€/año',e:''},{v:'bajos',l:'8.000–15.000€',e:''},{v:'medios',l:'15.000–30.000€',e:''},{v:'altos',l:'> 30.000€',e:''},
  ]},
  especial: { multi: true, opts: [
    {v:'discapacidad',l:'Discapacidad',e:''},{v:'dependencia',l:'Dependencia',e:''},{v:'victima_violencia',l:'Víctima violencia',e:'️'},{v:'inmigrante',l:'Inmigrante/refugiado',e:''},{v:'ninguna',l:'Ninguna',e:''},
  ]},
  vehiculo: { multi: true, opts: [
    {v:'coche_gasolina',l:'Coche gasolina/diésel',e:''},{v:'coche_electrico',l:'Coche eléctrico/híbrido',e:''},{v:'moto',l:'Moto',e:'️'},{v:'quiero_vehiculo',l:'Quiero vehículo',e:''},{v:'sin_vehiculo',l:'No tengo',e:''},
  ]},
  extras: { multi: true, opts: [
    {v:'mascotas',l:'Mascotas',e:''},{v:'energia',l:'Eficiencia energética',e:'️'},{v:'salud_cronica',l:'Enfermedad crónica',e:''},
    {v:'gafas_audifonos',l:'Gafas/audífonos',e:''},{v:'estudios_hijos',l:'Hijos en edad escolar',e:''},{v:'negocio_digital',l:'Digitalizar negocio',e:''},{v:'pyme',l:'Empresa/pyme',e:''},{v:'ninguno',l:'Ninguno',e:''},
  ]},
  empadronamiento: { multi: false, opts: [
    {v:'empadronado_si',l:'Sí, aquí',e:''},{v:'empadronado_no',l:'No, en otro lugar',e:''},
  ]},
  gestoria: { multi: false, opts: [
    {v:'si_gestoria',l:'Sí tengo gestoría',e:''},{v:'no_gestoria',l:'No tengo',e:''},{v:'quiero_gestoria',l:'Me interesaría una',e:''},
  ]},
}

const SECCIONES_PERFIL = [
  { id:'situacion',         label:'Situación laboral' },
  { id:'nacimiento',        label:'Fecha de nacimiento', tipo:'fecha' },
  { id:'genero',            label:'Género' },
  { id:'familia',           label:'Situación familiar' },
  { id:'vivienda',          label:'Vivienda' },
  { id:'alquiler_detalle',  label:'Alquiler mensual', condicion: p => (p.vivienda||[]).includes('alquiler') },
  { id:'alquiler_compartido',label:'Alquiler compartido', condicion: p => (p.vivienda||[]).includes('alquiler') },
  { id:'ingresos',          label:'Ingresos anuales' },
  { id:'especial',          label:'Situaciones especiales' },
  { id:'vehiculo',          label:'Vehículo' },
  { id:'extras',            label:'Extras' },
  { id:'pueblo',            label:'Población', tipo:'pueblo' },
  { id:'empadronamiento',   label:'Empadronado aquí' },
  { id:'gestoria',          label:'Gestoría' },
]

function ValorPerfil({ id, valor, tipo }) {
  if (!valor || valor.length === 0) return <span className="text-[#B0AAA0] italic text-sm">No especificado</span>
  if (tipo === 'fecha') {
    const hoy = new Date(), nac = new Date(valor[0])
    let e = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
    return <span className="text-[#f0f0f5] text-sm">{new Date(valor[0]).toLocaleDateString('es-ES')} ({e} años)</span>
  }
  if (tipo === 'pueblo') {
    try { const m = JSON.parse(valor[0]); return <span className="text-[#f0f0f5] text-sm">{m.nombre} · {m.provincia}</span> }
    catch { return <span className="text-[#f0f0f5] text-sm">{valor[0]}</span> }
  }
  return <span className="text-[#f0f0f5] text-sm">{valor.map(v => LABELS[v] || v).join(', ')}</span>
}

// Búsqueda de municipios — Google Places nueva API + Nominatim fallback
async function buscarMunicipio(query) {
  if (query.length < 2) return []

  // Intentar nueva API Google Places (AutocompleteSuggestion)
  try {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places')
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        language: 'es',
        region: 'es',
        includedPrimaryTypes: ['locality', 'administrative_area_level_3', 'postal_town'],
      })
      if (suggestions?.length) {
        const resultados = await Promise.all(
          suggestions.slice(0, 6).map(async (s) => {
            try {
              const place = s.placePrediction.toPlace()
              await place.fetchFields({ fields: ['addressComponents', 'displayName'] })
              const comps = place.addressComponents || []
              const get = (type) => comps.find(c => c.types?.includes(type))?.longText || ''
              return {
                nombre: get('locality') || get('administrative_area_level_3') || get('postal_town') || place.displayName || s.placePrediction.text?.text || '',
                provincia: get('administrative_area_level_2') || '',
                ccaa: get('administrative_area_level_1') || '',
                comarca: get('administrative_area_level_3') || get('administrative_area_level_2') || '',
              }
            } catch { return null }
          })
        )
        const filtrados = resultados.filter(r => r?.nombre)
        if (filtrados.length > 0) return filtrados
      }
    }
  } catch {}

  // Fallback: Nominatim (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},+España&format=json&limit=8&addressdetails=1&accept-language=es&countrycodes=es`
    const r = await fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'Cobratelo.es/1.0' } })
    const data = await r.json()
    return data
      .filter(d => d.address?.country_code === 'es' && !['road','motorway','building'].includes(d.type))
      .map(d => ({
        nombre: d.address.municipality || d.address.city || d.address.town || d.address.village || d.address.hamlet || d.name,
        provincia: d.address.province || d.address.county || '',
        ccaa: d.address.state || '',
        comarca: d.address.county || d.address.state_district || '',
      }))
      .filter(d => d.nombre)
      .filter((v, i, a) => a.findIndex(t => t.nombre?.toLowerCase() === v.nombre?.toLowerCase()) === i)
      .slice(0, 6)
  } catch { return [] }
}

// Modal fecha de nacimiento
function ModalFecha({ valor, onGuardar, onCerrar }) {
  const hoy = new Date()
  const minDate = new Date(); minDate.setFullYear(hoy.getFullYear() - 120)
  const [fecha, setFecha] = useState((valor || [])[0] || '')

  const edad = fecha ? (() => {
    const nac = new Date(fecha)
    let e = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
    return e
  })() : null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#2a1500] rounded-3xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <h3 className="font-semibold text-[#f0f0f5]">Fecha de nacimiento</h3>
          <button onClick={onCerrar} className="text-[rgba(240,240,245,0.5)] hover:text-[#f0f0f5] text-xl"></button>
        </div>
        <div className="p-6">
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            max={hoy.toISOString().split('T')[0]}
            min={minDate.toISOString().split('T')[0]}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-[rgba(255,255,255,0.08)] bg-[#2a1500] focus:outline-none focus:border-[#cc5500] text-[#f0f0f5] text-lg transition-colors"
          />
          {fecha && edad !== null && edad >= 0 && (
            <p className="text-sm text-[#cc5500] mt-2 font-medium">{edad} años</p>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.5)] text-sm">Cancelar</button>
          <button onClick={() => onGuardar('nacimiento', [fecha])} disabled={!fecha || !edad || edad < 0 || edad > 120}
            className="flex-1 py-3 rounded-full bg-[#f0f0f5] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal pueblo con autocompletado
function ModalPueblo({ campoId, titulo, valor, onGuardar, onCerrar }) {
  const [query, setQuery] = useState(() => {
    try { const m = JSON.parse((valor || [])[0]); return m.nombre || '' } catch { return '' }
  })
  const [sugerencias, setSugerencias] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const timerRef = useRef(null)

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    setSeleccionado(null)
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
    setSeleccionado(mun)
  }

  const handleGuardar = () => {
    onGuardar(campoId, {
      [campoId]: [JSON.stringify(seleccionado)],
      ...(campoId === 'pueblo' ? {
        ccaa: [seleccionado.ccaa],
        provincia: [seleccionado.provincia],
        comarca: [seleccionado.comarca],
      } : {
        ccaa_empadron: [seleccionado.ccaa],
        provincia_empadron: [seleccionado.provincia],
        comarca_empadron: [seleccionado.comarca],
      })
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#2a1500] rounded-3xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <h3 className="font-semibold text-[#f0f0f5]">{titulo}</h3>
          <button onClick={onCerrar} className="text-[rgba(240,240,245,0.5)] hover:text-[#f0f0f5] text-xl"></button>
        </div>
        <div className="p-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Escribe tu pueblo o ciudad..."
              className={`w-full px-4 py-3.5 rounded-2xl border-2 text-[#f0f0f5] font-medium focus:outline-none transition-colors
                ${seleccionado ? 'border-[#cc5500] bg-[rgba(255,131,0,0.1)]' : 'border-[rgba(255,255,255,0.08)] bg-[#2a1500] focus:border-[#cc5500]'}`}
            />
            {buscando && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#cc5500] border-t-transparent rounded-full animate-spin" />}
            {seleccionado && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cc5500] font-bold"></div>}
            {sugerencias.length > 0 && !seleccionado && (
              <div className="absolute z-20 w-full mt-2 bg-[#2a1500] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-lg overflow-hidden">
                {sugerencias.map((mun, i) => (
                  <button key={i} onClick={() => handleSelect(mun)}
                    className="w-full text-left px-4 py-3 hover:bg-[#321A00] border-b border-[rgba(255,255,255,0.06)] last:border-0">
                    <span className="font-semibold text-[#f0f0f5]">{mun.nombre}</span>
                    <span className="text-sm text-[rgba(240,240,245,0.5)] ml-2">{mun.provincia}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {seleccionado && (
            <div className="mt-3 p-3 bg-[rgba(255,131,0,0.1)] rounded-xl text-sm">
              <span className="font-medium text-[#cc5500]">{seleccionado.ccaa}</span>
              <span className="text-[rgba(240,240,245,0.5)]"> · {seleccionado.provincia}</span>
              {seleccionado.comarca && seleccionado.comarca !== seleccionado.provincia && (
                <span className="text-[rgba(240,240,245,0.5)]"> · {seleccionado.comarca}</span>
              )}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.5)] text-sm">Cancelar</button>
          <button onClick={handleGuardar} disabled={!seleccionado}
            className="flex-1 py-3 rounded-full bg-[#f0f0f5] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de edición inline para una sección
function ModalEditar({ seccion, valor, perfil, onGuardar, onCerrar }) {
  const config = OPCIONES_SECCION[seccion.id]
  const [sel, setSel] = useState(valor || [])

  if (!config) return null

  const toggle = (v) => {
    if (config.multi) {
      setSel(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
    } else {
      setSel([v])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#2a1500] rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between sticky top-0 bg-[#2a1500] rounded-t-3xl">
          <h3 className="font-semibold text-[#f0f0f5]">{seccion.label}</h3>
          <button onClick={onCerrar} className="text-[rgba(240,240,245,0.5)] hover:text-[#f0f0f5] text-xl"></button>
        </div>
        <div className="p-5 grid grid-cols-1 gap-2">
          {config.opts.map(op => {
            const active = sel.includes(op.v)
            return (
              <button key={op.v} onClick={() => toggle(op.v)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all
                  ${active ? 'border-[#cc5500] bg-[rgba(255,131,0,0.1)]' : 'border-[rgba(255,255,255,0.08)] bg-[#2a1500] hover:border-[#C0BAB0]'}`}>
                <span className="text-xl">{op.e}</span>
                <span className="font-medium text-sm flex-1">{op.l}</span>
                {active && <span className="text-[#cc5500] font-bold"></span>}
              </button>
            )
          })}
        </div>
        <div className="px-5 pb-5 flex gap-3 sticky bottom-0 bg-[#2a1500] rounded-b-3xl pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={onCerrar}
            className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.5)] text-sm font-medium">
            Cancelar
          </button>
          <button onClick={() => onGuardar(seccion.id, sel)} disabled={sel.length === 0 && (valor || []).length === 0}
            className="flex-1 py-3 rounded-full bg-[#f0f0f5] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cuenta() {
  const router = useRouter()
  const [mostrarBotonAyudas, setMostrarBotonAyudas] = useState(false)
  const { perfil: perfilParam } = router.query
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilData, setPerfilData] = useState(null)
  const [plan, setPlan] = useState('free')
  const [tab, setTab] = useState('perfil')
  const [editando, setEditando] = useState(null) // id de sección editando
  const [editandoFecha, setEditandoFecha] = useState(false)
  const [editandoPueblo, setEditandoPueblo] = useState(null) // null | 'pueblo' | 'pueblo_empadron'
  const [guardando, setGuardando] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [numAyudas, setNumAyudas] = useState(null)
  const [emailGestor, setEmailGestor] = useState('')
  const [enviandoGestor, setEnviandoGestor] = useState(false)
  const [envioGestorOk, setEnvioGestorOk] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setSession(session)
      const { data: userData } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single()
      if (userData) {
        setPerfilData(userData.perfil)
        setPlan(userData.plan || 'free')
        setNumAyudas(userData.ayudas_calculadas?.length ?? null)
        setEmailGestor(userData.perfil?.email_gestoria?.[0] || '')
      }
      if (perfilParam) {
        try {
          const p = JSON.parse(decodeURIComponent(perfilParam))
          await supabase.from('usuarios').upsert({ id: session.user.id, email: session.user.email, perfil: p, updated_at: new Date().toISOString() }, { onConflict: 'id' })
          setPerfilData(p)
        } catch (e) {}
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) router.push('/login') })
    return () => subscription.unsubscribe()
  }, [router.isReady])

  const handleEnviarGestor = async () => {
    if (!emailGestor || enviandoGestor) return
    setEnviandoGestor(true)
    try {
      // Obtener las ayudas cacheadas del usuario
      const { data: userData } = await supabase.from('usuarios')
        .select('ayudas_calculadas')
        .eq('id', session.user.id)
        .single()
      
      let ayudasData = []
      if (userData?.ayudas_calculadas?.length) {
        const { data } = await supabase.from('ayudas')
          .select('id,nombre,organismo,importe_max,descripcion,url_oficial')
          .in('id', userData.ayudas_calculadas)
        ayudasData = data || []
      }

      const res = await fetch('/api/enviar-gestor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailGestor,
          emailUsuario: session.user.email,
          nombreCliente: session.user.email,
          ayudas: ayudasData,
          perfil: perfilData,
          clienteId: session.user.id,
        })
      })
      if (res.ok) {
        setEnvioGestorOk(true)
        // Guardar email gestor en perfil si no estaba
        if (!perfilData?.email_gestoria?.[0]) {
          const nuevoPerfil = { ...perfilData, email_gestoria: [emailGestor] }
          await supabase.from('usuarios').update({ perfil: nuevoPerfil }).eq('id', session.user.id)
          setPerfilData(nuevoPerfil)
        }
      } else {
        alert('Error al enviar. Inténtalo de nuevo.')
      }
    } catch (e) { alert('Error al enviar.') }
    finally { setEnviandoGestor(false) }
  }

  const handleGuardarPueblo = async (campoId, camposPerfil) => {
    setGuardando(true)
    const nuevoPerfil = { ...perfilData, ...camposPerfil }
    const { error } = await supabase.from('usuarios').upsert({
      id: session.user.id, email: session.user.email,
      perfil: nuevoPerfil, updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    if (!error) {
      setPerfilData(nuevoPerfil)
      setEditandoPueblo(null)
      setMostrarBotonAyudas(true)
    }
    setGuardando(false)
  }

  const handleGuardarSeccion = async (id, valor) => {
    setGuardando(true)
    const nuevoPerfil = { ...perfilData, [id]: valor }
    const { error } = await supabase.from('usuarios').upsert({
      id: session.user.id, email: session.user.email,
      perfil: nuevoPerfil, updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    if (!error) { setPerfilData(nuevoPerfil); setEditando(null) }
    setGuardando(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    if (nuevaPassword.length < 6) { setPasswordMsg('Mínimo 6 caracteres.'); return }
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (error) setPasswordMsg('Error: ' + error.message)
    else { setPasswordMsg('Contraseña actualizada. '); setNuevaPassword(''); setCambiandoPassword(false) }
  }

  const handleEliminarCuenta = async () => {
    if (confirmText !== 'ELIMINAR') return
    setEliminando(true)
    try {
      await supabase.from('usuarios').delete().eq('id', session.user.id)
      await supabase.auth.signOut()
      router.push('/?eliminado=1')
    } catch { setEliminando(false) }
  }

  const handlePortalFacturacion = async () => {
    try {
      const res = await fetch('/api/portal', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:session.user.id,email:session.user.email}) })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch { alert('Error al abrir el portal de facturación.') }
  }

  const seccionEditando = SECCIONES_PERFIL.find(s => s.id === editando)

  if (loading) return (
    <div className="min-h-screen bg-[#321A00] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#cc5500] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  // Helper: iniciales del email
  const initials = session?.user?.email?.[0]?.toUpperCase() || '?'
  const emailShort = session?.user?.email || ''
  const planLabel = plan === 'pro' ? 'Gestoría Pro' : plan === 'starter' ? 'Gestoría Starter' : plan === 'alertas' ? 'Alertas' : 'Particular'
  const planColor = plan === 'pro' ? '#FF8300' : plan === 'starter' ? '#FF8300' : 'rgba(255,245,235,0.4)'

  return (
    <>
      <Head><title>Mi cuenta — Cóbratelo</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>

      <div style={{ background: '#321A00', minHeight: '100vh' }}>

        {/* NAV */}
        <nav style={{ background: 'rgba(50,26,0,0.95)', borderBottom: '1px solid rgba(255,200,120,0.12)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none' }}>
              cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/resultados" style={{ fontSize: 13, color: 'rgba(255,245,235,0.5)', textDecoration: 'none', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,200,120,0.12)' }}>Mis ayudas</Link>
              {['starter', 'pro'].includes(plan) && (
                <Link href="/gestor/expedientes" style={{ fontSize: 13, color: '#cc5500', textDecoration: 'none', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(204,85,0,0.3)', background: 'rgba(204,85,0,0.06)' }}>Panel gestoría</Link>
              )}
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                style={{ fontSize: 13, color: 'rgba(255,245,235,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 14px' }}>
                Salir
              </button>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 64px' }} className="crm-layout">

          {/* ── SIDEBAR — Ficha de contacto ── */}
          <div className="crm-sidebar">
            <div style={{ background: 'rgba(255,200,120,0.06)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20, overflow: 'hidden' }}>
              {/* Avatar + nombre */}
              <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,200,120,0.08)', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,131,0,0.2)', border: '2px solid rgba(255,131,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22, fontWeight: 700, color: '#FF8300' }}>
                  {initials}
                </div>
                <p style={{ fontSize: 13, color: '#FFF5EB', fontWeight: 600, marginBottom: 4, wordBreak: 'break-all' }}>{emailShort}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: planColor, background: 'rgba(255,131,0,0.12)', padding: '3px 10px', borderRadius: 100 }}>
                  {planLabel}
                </span>
              </div>

              {/* Acciones rápidas */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,245,235,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>ACCIONES RÁPIDAS</p>
                <Link href="/resultados" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', marginBottom: 4, background: 'rgba(255,131,0,0.08)', color: '#FF8300', fontSize: 13, fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Ver mis ayudas
                  </div>
                  {numAyudas !== null && (
                    <span style={{ background: '#FF8300', color: '#1a0d00', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>{numAyudas}</span>
                  )}
                </Link>
                <Link href="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', marginBottom: 4, color: 'rgba(255,245,235,0.6)', fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Actualizar perfil
                </Link>
                {plan === 'free' && (
                  <Link href="/precios" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', marginBottom: 4, color: 'rgba(255,245,235,0.6)', fontSize: 13 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Actualizar plan
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── CONTENIDO PRINCIPAL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Bloque — Mi perfil */}
            <div style={{ background: 'rgba(255,200,120,0.04)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,200,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#FFF5EB' }}>Perfil</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.4)', marginTop: 2 }}>Tus datos determinan qué ayudas ves</p>
                </div>
                <Link href="/perfil" style={{ fontSize: 12, color: '#FF8300', textDecoration: 'none', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,131,0,0.3)', fontWeight: 600 }}>
                  Editar →
                </Link>
              </div>
              <div style={{ padding: '8px 0' }}>
                {perfilData && [
                  { label: 'Situación laboral', id: 'situacion' },
                  { label: 'Fecha de nacimiento', id: 'nacimiento', tipo: 'fecha' },
                  { label: 'Situación familiar', id: 'familia' },
                  { label: 'Vivienda', id: 'vivienda' },
                  { label: 'Ingresos anuales', id: 'ingresos' },
                  { label: 'Población', id: 'pueblo', tipo: 'pueblo' },
                  { label: 'Vehículo', id: 'vehiculo' },
                  { label: 'Situaciones especiales', id: 'especial' },
                  { label: 'Extras', id: 'extras' },
                  { label: 'Gestoría', id: 'gestoria' },
                ].map(({ label, id, tipo }) => {
                  const valor = perfilData[id]
                  const tieneDatos = valor && valor.length > 0
                  let texto = '—'
                  if (tieneDatos) {
                    if (tipo === 'fecha') texto = new Date(valor[0]).toLocaleDateString('es-ES')
                    else if (tipo === 'pueblo') { try { const m = JSON.parse(valor[0]); texto = m.nombre + ' · ' + m.provincia } catch { texto = valor[0] } }
                    else texto = valor.map(v => LABELS[v] || v).join(', ')
                  }
                  const handleClickCampo = () => {
                    if (tipo === 'fecha') { setEditandoFecha(true) }
                    else if (tipo === 'pueblo') { setEditandoPueblo('pueblo') }
                    else {
                      const s = SECCIONES_PERFIL.find(sec => sec.id === id)
                      if (s) setEditando(s)
                    }
                  }
                  return (
                    <div key={id} onClick={handleClickCampo} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 20px',
                      borderBottom: '1px solid rgba(255,200,120,0.08)',
                      background: tieneDatos ? 'rgba(255,220,170,0.18)' : 'rgba(255,255,255,0.01)',
                      borderLeft: tieneDatos ? '3px solid rgba(204,85,0,0.6)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,200,120,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = tieneDatos ? 'rgba(255,220,170,0.18)' : 'rgba(255,255,255,0.01)'}>
                      <p style={{ fontSize: 12, color: tieneDatos ? 'rgba(255,245,235,0.6)' : 'rgba(255,245,235,0.25)', width: 150, flexShrink: 0 }}>{label}</p>
                      <p style={{ fontSize: 13, color: tieneDatos ? '#FFF5EB' : 'rgba(255,245,235,0.2)', flex: 1, fontStyle: tieneDatos ? 'normal' : 'italic' }}>{texto}</p>
                      <span style={{ fontSize: 11, color: 'rgba(255,245,235,0.3)', marginLeft: 8, flexShrink: 0 }}>✏️</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bloque — Suscripción */}
            <div style={{ background: 'rgba(255,200,120,0.04)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,200,120,0.08)' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#FFF5EB' }}>Suscripción</p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#FFF5EB' }}>{planLabel}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,245,235,0.4)', marginTop: 3 }}>
                      {plan === 'free' ? 'Gratuito · siempre' : plan === 'starter' ? '149€/mes' : plan === 'pro' ? '399€/mes' : '—'}
                    </p>
                  </div>
                  {plan === 'free' ? (
                    <Link href="/precios" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 100, textDecoration: 'none' }}>
                      Actualizar →
                    </Link>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(34,197,94,0.2)' }}>
                      ● Activo
                    </span>
                  )}
                </div>
                {plan !== 'free' && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={handlePortalFacturacion}
                      style={{ fontSize: 12, color: 'rgba(255,245,235,0.5)', background: 'transparent', textDecoration: 'none', padding: '7px 14px', borderRadius: 100, border: '1px solid rgba(255,200,120,0.15)', cursor: 'pointer' }}>
                      Gestionar facturación
                    </button>
                    <button onClick={() => {if(confirm('¿Cancelar suscripción?')) alert('Escribe a hola@cobratelo.es para cancelar.')}}
                      style={{ fontSize: 12, color: 'rgba(255,100,100,0.6)', background: 'transparent', border: '1px solid rgba(255,100,100,0.2)', padding: '7px 14px', borderRadius: 100, cursor: 'pointer' }}>
                      Cancelar plan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bloque — Enviar a gestoría */}
            <div style={{ background: 'rgba(255,200,120,0.04)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,200,120,0.08)' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#FFF5EB' }}>Enviar a tu gestoría</p>
                <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.4)', marginTop: 2 }}>Comparte tus ayudas con tu gestor para que te ayude a tramitarlas</p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {envioGestorOk ? (
                  <div style={{ background: 'rgba(77,182,42,0.1)', border: '1px solid rgba(77,182,42,0.3)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#4DB62A' }}>¡Enviado correctamente!</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.5)', marginTop: 4 }}>Hemos enviado una copia también a tu email.</p>
                    <button onClick={() => setEnvioGestorOk(false)} style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,245,235,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Enviar de nuevo</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'rgba(255,245,235,0.4)', display: 'block', marginBottom: 6 }}>Email de tu gestoría</label>
                      <input
                        type="email"
                        value={emailGestor}
                        onChange={e => setEmailGestor(e.target.value)}
                        placeholder="gestor@gestoria.com"
                        style={{ width: '100%', background: 'rgba(255,200,120,0.06)', border: '1px solid rgba(255,200,120,0.2)', borderRadius: 10, padding: '10px 14px', color: '#FFF5EB', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.3)', margin: 0 }}>
                      Se enviará un informe con tus {numAyudas || ''} ayudas identificadas. Recibirás una copia en tu email.
                    </p>
                    <button
                      onClick={handleEnviarGestor}
                      disabled={!emailGestor || enviandoGestor}
                      style={{ background: emailGestor ? '#cc5500' : 'rgba(255,200,120,0.1)', color: emailGestor ? '#fff' : 'rgba(255,245,235,0.3)', border: 'none', padding: '11px 0', borderRadius: 100, cursor: emailGestor ? 'pointer' : 'default', fontWeight: 600, fontSize: 14, width: '100%', transition: 'all 0.2s' }}>
                      {enviandoGestor ? 'Enviando...' : '📤 Enviar a mi gestoría'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bloque — Cuenta */}
            <div style={{ background: 'rgba(255,200,120,0.04)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,200,120,0.08)' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#FFF5EB' }}>Cuenta</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#FFF5EB' }}>Email</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.4)', marginTop: 2 }}>{emailShort}</p>
                  </div>
                </div>
                <div style={{ height: 1, background: 'rgba(255,200,120,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#FFF5EB' }}>Alertas semanales</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.4)', marginTop: 2 }}>Aviso cuando aparecen nuevas ayudas para tu perfil</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: 100 }}>Activas</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,200,120,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,100,100,0.7)' }}>Eliminar cuenta</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.3)', marginTop: 2 }}>Borra todos tus datos permanentemente</p>
                  </div>
                  <button onClick={() => { if(confirm('¿Eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.')) alert('Escribe a hola@cobratelo.es para eliminar tu cuenta.') }}
                    style={{ fontSize: 12, color: 'rgba(255,100,100,0.6)', background: 'transparent', border: '1px solid rgba(255,100,100,0.2)', padding: '7px 14px', borderRadius: 100, cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modales existentes */}
      {editando && <ModalEditar seccion={editando} valor={perfilData?.[editando?.id]} perfil={perfilData} onGuardar={handleGuardarSeccion} onCerrar={() => setEditando(null)} />}
      {editandoPueblo && <ModalPueblo valor={perfilData?.pueblo} onGuardar={(campo, campos) => handleGuardarPueblo(campo, campos)} onCerrar={() => setEditandoPueblo(false)} />}
    </>
  )
}
