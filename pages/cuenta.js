import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  empadronado_si:'Sí',empadronado_no:'No (otro lugar)',
}

// Opciones para edición inline — igual que perfil.js
const OPCIONES_SECCION = {
  situacion: { multi: true, opts: [
    {v:'empleado',l:'Empleado/a',e:'👔'},{v:'autonomo',l:'Autónomo/a',e:'💼'},{v:'desempleado',l:'En paro',e:'🔍'},
    {v:'pensionista',l:'Pensionista',e:'🏖️'},{v:'estudiante',l:'Estudiante',e:'📚'},{v:'emprendedor',l:'Quiero emprender',e:'🚀'},
  ]},
  familia: { multi: true, opts: [
    {v:'soltero',l:'Soltero/a',e:'🙋'},{v:'casado',l:'Casado/a o pareja',e:'💍'},{v:'divorciado',l:'Divorciado/a',e:'⚖️'},{v:'viudo',l:'Viudo/a',e:'🕊️'},
    {v:'hijos_menores3',l:'Hijos < 3 años',e:'👶'},{v:'hijos_3_18',l:'Hijos 3-18 años',e:'🧒'},{v:'familia_numerosa',l:'Familia numerosa',e:'👨‍👩‍👧‍👦'},
    {v:'monoparental',l:'Monoparental',e:'💪'},{v:'embarazada',l:'Embarazada/adopción',e:'🤱'},{v:'dependiente_cargo',l:'Dependiente a cargo',e:'🤝'},{v:'sin_cargas',l:'Sin cargas',e:'✌️'},
  ]},
  vivienda: { multi: true, opts: [
    {v:'alquiler',l:'Vivo de alquiler',e:'🏠'},{v:'propietario',l:'Propiedad',e:'🏡'},{v:'hipoteca',l:'Hipoteca',e:'🏦'},
    {v:'busco_vivienda',l:'Buscando vivienda',e:'🔑'},{v:'rehabilitacion',l:'Quiero reformar',e:'🔨'},{v:'sin_vivienda',l:'Sin vivienda',e:'⚠️'},
  ]},
  alquiler_detalle: { multi: false, condicion: p => (p.vivienda||[]).includes('alquiler'), opts: [
    {v:'alquiler_menos300',l:'< 300€/mes',e:'💚'},{v:'alquiler_300_600',l:'300–600€/mes',e:'💛'},
    {v:'alquiler_600_900',l:'600–900€/mes',e:'🟠'},{v:'alquiler_900_1200',l:'900–1.200€/mes',e:'🔴'},{v:'alquiler_mas1200',l:'> 1.200€/mes',e:'⛔'},
  ]},
  alquiler_compartido: { multi: false, condicion: p => (p.vivienda||[]).includes('alquiler'), opts: [
    {v:'alquiler_solo',l:'Solo/a',e:'🙋'},{v:'alquiler_pareja',l:'Con pareja/familia',e:'👫'},{v:'alquiler_compis',l:'Piso compartido',e:'🏠'},
  ]},
  ingresos: { multi: false, opts: [
    {v:'sin_ingresos',l:'< 8.000€/año',e:'📉'},{v:'bajos',l:'8.000–15.000€',e:'💰'},{v:'medios',l:'15.000–30.000€',e:'💰💰'},{v:'altos',l:'> 30.000€',e:'💰💰💰'},
  ]},
  especial: { multi: true, opts: [
    {v:'discapacidad',l:'Discapacidad',e:'♿'},{v:'dependencia',l:'Dependencia',e:'🤲'},{v:'victima_violencia',l:'Víctima violencia',e:'🛡️'},{v:'inmigrante',l:'Inmigrante/refugiado',e:'🌍'},{v:'ninguna',l:'Ninguna',e:'✅'},
  ]},
  vehiculo: { multi: true, opts: [
    {v:'coche_gasolina',l:'Coche gasolina/diésel',e:'🚗'},{v:'coche_electrico',l:'Coche eléctrico/híbrido',e:'⚡'},{v:'moto',l:'Moto',e:'🏍️'},{v:'quiero_vehiculo',l:'Quiero vehículo',e:'🛒'},{v:'sin_vehiculo',l:'No tengo',e:'🚶'},
  ]},
  extras: { multi: true, opts: [
    {v:'mascotas',l:'Mascotas',e:'🐾'},{v:'energia',l:'Eficiencia energética',e:'☀️'},{v:'salud_cronica',l:'Enfermedad crónica',e:'💊'},
    {v:'gafas_audifonos',l:'Gafas/audífonos',e:'👓'},{v:'estudios_hijos',l:'Hijos en edad escolar',e:'🎓'},{v:'negocio_digital',l:'Digitalizar negocio',e:'💻'},{v:'pyme',l:'Empresa/pyme',e:'🏢'},{v:'ninguno',l:'Ninguno',e:'✅'},
  ]},
  empadronamiento: { multi: false, opts: [
    {v:'empadronado_si',l:'Sí, aquí',e:'✅'},{v:'empadronado_no',l:'No, en otro lugar',e:'📍'},
  ]},
  gestoria: { multi: false, opts: [
    {v:'si_gestoria',l:'Sí tengo gestoría',e:'📋'},{v:'no_gestoria',l:'No tengo',e:'🙋'},{v:'quiero_gestoria',l:'Me interesaría una',e:'🤝'},
  ]},
}

const SECCIONES_PERFIL = [
  { id:'situacion',         label:'Situación laboral' },
  { id:'nacimiento',        label:'Fecha de nacimiento', tipo:'fecha' },
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
    return <span className="text-[#111110] text-sm">{new Date(valor[0]).toLocaleDateString('es-ES')} ({e} años)</span>
  }
  if (tipo === 'pueblo') {
    try { const m = JSON.parse(valor[0]); return <span className="text-[#111110] text-sm">{m.nombre} · {m.provincia}</span> }
    catch { return <span className="text-[#111110] text-sm">{valor[0]}</span> }
  }
  return <span className="text-[#111110] text-sm">{valor.map(v => LABELS[v] || v).join(', ')}</span>
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
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-[#F0EAE0] flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-semibold text-[#111110]">{seccion.label}</h3>
          <button onClick={onCerrar} className="text-[#888882] hover:text-[#111110] text-xl">✕</button>
        </div>
        <div className="p-5 grid grid-cols-1 gap-2">
          {config.opts.map(op => {
            const active = sel.includes(op.v)
            return (
              <button key={op.v} onClick={() => toggle(op.v)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all
                  ${active ? 'border-[#1A7A4A] bg-[#E8F5EE]' : 'border-[#E0DAD0] bg-white hover:border-[#C0BAB0]'}`}>
                <span className="text-xl">{op.e}</span>
                <span className="font-medium text-sm flex-1">{op.l}</span>
                {active && <span className="text-[#1A7A4A] font-bold">✓</span>}
              </button>
            )
          })}
        </div>
        <div className="px-5 pb-5 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl pt-2 border-t border-[#F0EAE0]">
          <button onClick={onCerrar}
            className="flex-1 py-3 rounded-full border border-[#E0DAD0] text-[#888882] text-sm font-medium">
            Cancelar
          </button>
          <button onClick={() => onGuardar(seccion.id, sel)} disabled={sel.length === 0}
            className="flex-1 py-3 rounded-full bg-[#111110] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#333330] transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cuenta() {
  const router = useRouter()
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setSession(session)
      const { data: userData } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single()
      if (userData) { setPerfilData(userData.perfil); setPlan(userData.plan || 'free') }
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
    else { setPasswordMsg('Contraseña actualizada. ✓'); setNuevaPassword(''); setCambiandoPassword(false) }
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
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Head><title>Mi cuenta — Cóbratelo</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">cóbratelo<span className="text-[#1A7A4A]">.es</span></Link>
          <button onClick={handleLogout} className="text-sm text-[#888882] hover:text-[#111110] transition-colors">Cerrar sesión</button>
        </nav>

        <div className="max-w-2xl mx-auto px-6 pb-20">
          <h1 className="font-display text-3xl font-bold text-[#111110] mb-1">
            {session?.user?.user_metadata?.nombre ? `Hola, ${session.user.user_metadata.nombre}` : 'Mi cuenta'}
          </h1>
          <p className="text-[#888882] mb-6">{session?.user?.email}</p>

          <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-full p-1 mb-8 w-fit">
            {[{id:'perfil',label:'Mi perfil'},{id:'pagos',label:'Suscripción'},{id:'cuenta',label:'Cuenta'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t.id ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Mi perfil */}
          {tab === 'perfil' && (
            <div>
              {perfilData ? (
                <>
                  {/* CTA principal: Ver ayudas */}
                  <Link
                    href={`/resultados?perfil=${encodeURIComponent(JSON.stringify(perfilData))}`}
                    className="flex items-center justify-between w-full bg-[#111110] text-[#F7F3EC] rounded-2xl px-6 py-5 mb-5 hover:bg-[#333330] transition-colors group">
                    <div>
                      <p className="font-semibold text-lg">Ver mis ayudas</p>
                      <p className="text-sm text-[#888882] mt-0.5">Basadas en tu perfil actualizado</p>
                    </div>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <p className="text-xs text-[#888882] mb-3 uppercase tracking-wide font-medium">Toca cualquier campo para editarlo</p>
                  <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden">
                    {SECCIONES_PERFIL.filter(s => !s.condicion || s.condicion(perfilData)).map((sec, i, arr) => {
                      const valor = perfilData[sec.id]
                      const tieneOpciones = !!OPCIONES_SECCION[sec.id]
                      const esFecha = sec.tipo === 'fecha'
                      const esPueblo = sec.tipo === 'pueblo'
                      const esEditable = tieneOpciones || esFecha || esPueblo
                      return (
                        <button key={sec.id} disabled={!esEditable}
                          onClick={() => {
                            if (esFecha) setEditandoFecha(true)
                            else if (esPueblo) setEditandoPueblo(sec.id)
                            else if (tieneOpciones) setEditando(sec.id)
                          }}
                          className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors
                            ${i > 0 ? 'border-t border-[#F0EAE0]' : ''}
                            ${esEditable ? 'hover:bg-[#F7F3EC] cursor-pointer' : 'cursor-default'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#888882] mb-0.5">{sec.label}</p>
                            <ValorPerfil id={sec.id} valor={valor} tipo={sec.tipo} />
                          </div>
                          {esEditable && (
                            <span className="text-[#C0BAB0] text-sm ml-3 shrink-0">✏️</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-[#B0AAA0] mt-3">Los cambios se guardan al instante.</p>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E0DAD0] p-8 text-center">
                  <p className="text-[#888882] mb-4">Aún no has completado tu perfil.</p>
                  <Link href="/perfil" className="inline-block bg-[#E8540A] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#d14a08] transition-colors">
                    Completar perfil →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab: Suscripción */}
          {tab === 'pagos' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F0EAE0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#888882] uppercase tracking-wide font-medium mb-1">Plan actual</p>
                      <p className="font-semibold text-[#111110] text-lg">{plan === 'free' ? 'Gratuito' : plan === 'alertas' ? 'Alertas' : 'Gestoría Pro'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${plan === 'free' ? 'bg-[#F0EAE0] text-[#888882]' : 'bg-[#E8F5EE] text-[#1A7A4A]'}`}>
                      {plan === 'free' ? 'Gratis' : plan === 'alertas' ? '0,99€/mes' : '49€/mes'}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {plan === 'free' ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#888882]">Sin alertas automáticas</p>
                      <Link href="/precios" className="text-sm font-semibold text-[#1A7A4A] hover:text-[#145e39] transition-colors ml-4">Mejorar →</Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#888882]">Alertas semanales activas</p>
                      <button onClick={handlePortalFacturacion} className="text-sm text-[#888882] hover:text-red-500 transition-colors ml-4">Cancelar</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F0EAE0]">
                  <p className="text-xs text-[#888882] uppercase tracking-wide font-medium mb-1">Facturación</p>
                  <p className="font-semibold text-[#111110]">Métodos de pago y facturas</p>
                </div>
                <div className="px-6 py-2">
                  {[
                    {icon:'💳',label:'Método de pago',sub:plan==='free'?'Sin método guardado':'Tarjeta guardada',btn:plan==='free'?'Añadir':'Cambiar'},
                    {icon:'🧾',label:'Historial de facturas',sub:'Descarga tus facturas en PDF',btn:'Ver →'},
                    {icon:'📧',label:'Email de facturación',sub:session?.user?.email,btn:'Editar'},
                  ].map((row,i) => (
                    <div key={i} className={`flex items-center justify-between py-4 ${i>0?'border-t border-[#F0EAE0]':''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{row.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-[#111110]">{row.label}</p>
                          <p className="text-xs text-[#888882]">{row.sub}</p>
                        </div>
                      </div>
                      <button onClick={handlePortalFacturacion} className="text-sm text-[#1A7A4A] font-medium hover:text-[#145e39] transition-colors ml-4">{row.btn}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-1">¿Eres gestoría?</h2>
                <p className="text-sm text-[#888882] mb-4">Planes profesionales para gestionar ayudas de varios clientes.</p>
                <Link href="/precios" className="inline-block bg-[#111110] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">Ver planes gestoría →</Link>
              </div>
            </div>
          )}

          {/* Tab: Cuenta */}
          {tab === 'cuenta' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-4">Datos de acceso</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888882]">Email</span>
                    <span className="text-[#111110] font-medium">{session?.user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888882]">Miembro desde</span>
                    <span className="text-[#111110] font-medium">{new Date(session?.user?.created_at).toLocaleDateString('es-ES',{month:'long',year:'numeric'})}</span>
                  </div>
                </div>
                {!cambiandoPassword ? (
                  <button onClick={() => setCambiandoPassword(true)} className="text-sm text-[#1A7A4A] font-medium underline">Cambiar contraseña</button>
                ) : (
                  <form onSubmit={handleCambiarPassword} className="mt-4 space-y-3">
                    <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} placeholder="Nueva contraseña (mín. 6 caracteres)"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                    {passwordMsg && <p className={`text-sm ${passwordMsg.includes('Error')?'text-red-600':'text-[#1A7A4A]'}`}>{passwordMsg}</p>}
                    <div className="flex gap-2">
                      <button type="submit" className="bg-[#111110] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">Guardar</button>
                      <button type="button" onClick={()=>{setCambiandoPassword(false);setPasswordMsg('')}} className="text-sm text-[#888882] px-5 py-2.5 rounded-full border border-[#E0DAD0]">Cancelar</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-3">Eliminar cuenta</h2>
                <p className="text-sm text-[#888882] mb-4">Se borrarán todos tus datos permanentemente.</p>
                {!confirmEliminar ? (
                  <button onClick={() => setConfirmEliminar(true)} className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium">Eliminar mi cuenta</button>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm font-semibold text-red-700 mb-2">¿Estás seguro?</p>
                    <p className="text-xs text-red-600 mb-3">Escribe <strong>ELIMINAR</strong> para confirmar.</p>
                    <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Escribe ELIMINAR"
                      className="w-full px-3 py-2 rounded-xl border border-red-300 text-sm mb-3 focus:outline-none focus:border-red-500" />
                    <div className="flex gap-2">
                      <button onClick={handleEliminarCuenta} disabled={confirmText!=='ELIMINAR'||eliminando}
                        className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-red-700 disabled:opacity-40 transition-colors">
                        {eliminando?'Eliminando...':'Eliminar definitivamente'}
                      </button>
                      <button onClick={()=>{setConfirmEliminar(false);setConfirmText('')}} className="text-sm text-[#888882] px-4 py-2 rounded-full border border-[#E0DAD0]">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="w-full py-3.5 rounded-full border border-[#E0DAD0] text-[#888882] font-medium hover:border-[#C0BAB0] transition-colors text-sm">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal fecha de nacimiento */}
      {editandoFecha && (
        <ModalFecha
          valor={perfilData?.nacimiento}
          onGuardar={handleGuardarSeccion}
          onCerrar={() => setEditandoFecha(false)}
        />
      )}

      {/* Modal pueblo */}
      {editandoPueblo && (
        <ModalPueblo
          campoId={editandoPueblo}
          titulo={editandoPueblo === 'pueblo' ? '¿En qué población vives?' : '¿En qué población estás empadronado/a?'}
          valor={perfilData?.[editandoPueblo]}
          onGuardar={handleGuardarPueblo}
          onCerrar={() => setEditandoPueblo(null)}
        />
      )}

      {/* Modal edición inline */}
      {editando && seccionEditando && OPCIONES_SECCION[editando] && (
        <ModalEditar
          seccion={seccionEditando}
          valor={perfilData?.[editando] || []}
          perfil={perfilData}
          onGuardar={handleGuardarSeccion}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  )
}
