import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

// Labels legibles para los valores del perfil
const LABELS = {
  // Situación laboral
  empleado: 'Empleado/a', autonomo: 'Autónomo/a', desempleado: 'En paro',
  pensionista: 'Pensionista', estudiante: 'Estudiante', emprendedor: 'Emprendedor/a',
  // Familia
  soltero: 'Soltero/a', casado: 'Casado/a o pareja', divorciado: 'Divorciado/a',
  viudo: 'Viudo/a', hijos_menores3: 'Hijos < 3 años', hijos_3_18: 'Hijos 3-18 años',
  familia_numerosa: 'Familia numerosa', monoparental: 'Monoparental',
  embarazada: 'Embarazada/adopción', dependiente_cargo: 'Dependiente a cargo',
  sin_cargas: 'Sin cargas familiares',
  // Vivienda
  alquiler: 'Alquiler', propietario: 'Propiedad', hipoteca: 'Hipoteca',
  busco_vivienda: 'Buscando vivienda', rehabilitacion: 'Quiere reformar',
  sin_vivienda: 'Sin vivienda estable',
  // Ingresos
  sin_ingresos: '< 8.000€/año', bajos: '8.000–15.000€', medios: '15.000–30.000€', altos: '> 30.000€',
  // Especiales
  discapacidad: 'Discapacidad', dependencia: 'Dependencia', victima_violencia: 'Víctima violencia',
  inmigrante: 'Inmigrante/refugiado', rural: 'Zona rural', ninguna: 'Ninguna',
  // Vehículo
  coche_gasolina: 'Coche gasolina/diésel', coche_electrico: 'Coche eléctrico/híbrido',
  moto: 'Moto', quiero_vehiculo: 'Quiere vehículo', sin_vehiculo: 'Sin vehículo',
  // Extras
  mascotas: 'Mascotas', energia: 'Eficiencia energética', salud_cronica: 'Enfermedad crónica',
  gafas_audifonos: 'Gafas/audífonos', estudios_hijos: 'Hijos en edad escolar',
  negocio_digital: 'Digitalización negocio', pyme: 'Empresa/pyme', ninguno: 'Ninguno',
  // Gestoría
  si_gestoria: 'Tiene gestoría', no_gestoria: 'Sin gestoría', quiero_gestoria: 'Quiere gestoría',
  // Empadronamiento
  empadronado_si: 'Sí', empadronado_no: 'No (empadronado en otro lugar)',
}

const SECCIONES_PERFIL = [
  { id: 'situacion',      label: 'Situación laboral' },
  { id: 'nacimiento',     label: 'Fecha de nacimiento', tipo: 'fecha' },
  { id: 'familia',        label: 'Situación familiar' },
  { id: 'vivienda',       label: 'Vivienda' },
  { id: 'ingresos',       label: 'Ingresos' },
  { id: 'especial',       label: 'Situaciones especiales' },
  { id: 'vehiculo',       label: 'Vehículo' },
  { id: 'extras',         label: 'Extras' },
  { id: 'pueblo',         label: 'Población', tipo: 'pueblo' },
  { id: 'empadronamiento',label: 'Empadronado aquí' },
  { id: 'gestoria',       label: 'Gestoría' },
]

function ValorPerfil({ id, valor, tipo }) {
  if (!valor || valor.length === 0) return <span className="text-[#B0AAA0] italic">No especificado</span>
  if (tipo === 'fecha') {
    const fecha = valor[0]
    if (!fecha) return <span className="text-[#B0AAA0] italic">No especificada</span>
    const edad = (() => {
      const hoy = new Date(); const nac = new Date(fecha)
      let e = hoy.getFullYear() - nac.getFullYear()
      if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
      return e
    })()
    return <span className="text-[#111110]">{new Date(fecha).toLocaleDateString('es-ES')} ({edad} años)</span>
  }
  if (tipo === 'pueblo') {
    try {
      const mun = JSON.parse(valor[0])
      return <span className="text-[#111110]">{mun.nombre} · {mun.provincia}</span>
    } catch { return <span className="text-[#111110]">{valor[0]}</span> }
  }
  return (
    <span className="text-[#111110]">
      {valor.map(v => LABELS[v] || v).join(', ')}
    </span>
  )
}

export default function Cuenta() {
  const router = useRouter()
  const { perfil: perfilParam } = router.query
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilData, setPerfilData] = useState(null)
  const [plan, setPlan] = useState('free')
  const [tab, setTab] = useState('perfil') // 'perfil' | 'pagos' | 'cuenta'
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setSession(session)

      // Cargar datos del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        setPerfilData(userData.perfil)
        setPlan(userData.plan || 'free')
      }

      // Si viene con perfil del cuestionario, guardarlo
      if (perfilParam) {
        try {
          const perfil = JSON.parse(decodeURIComponent(perfilParam))
          await supabase.from('usuarios').upsert({
            id: session.user.id,
            email: session.user.email,
            perfil,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          setPerfilData(perfil)
        } catch (e) { console.error(e) }
      }

      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [router.isReady])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handlePortalFacturacion = async () => {
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, email: session.user.email })
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e) {
      alert('Error al abrir el portal de facturación. Inténtalo de nuevo.')
    }
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    if (nuevaPassword.length < 6) { setPasswordMsg('Mínimo 6 caracteres.'); return }
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (error) setPasswordMsg('Error: ' + error.message)
    else { setPasswordMsg('Contraseña actualizada. ✓'); setNuevaPassword(''); setCambiandoPassword(false) }
  }

  const getPueblo = () => {
    if (!perfilData?.pueblo?.[0]) return null
    try { return JSON.parse(perfilData.pueblo[0]) } catch { return null }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Head>
        <title>Mi cuenta — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <button onClick={handleLogout} className="text-sm text-[#888882] hover:text-[#111110] transition-colors">
            Cerrar sesión
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-6 pb-20">
          <h1 className="font-display text-3xl font-bold text-[#111110] mb-1">
            {session?.user?.user_metadata?.nombre ? `Hola, ${session.user.user_metadata.nombre}` : 'Mi cuenta'}
          </h1>
          <p className="text-[#888882] mb-6">{session?.user?.email}</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-full p-1 mb-8 w-fit">
            {[
              { id: 'perfil', label: 'Mi perfil' },
              { id: 'pagos', label: 'Suscripción' },
              { id: 'cuenta', label: 'Cuenta' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${tab === t.id ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Perfil */}
          {tab === 'perfil' && (
            <div>
              {perfilData ? (
                <>
                  <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden mb-4">
                    {SECCIONES_PERFIL.map((sec, i) => {
                      const valor = perfilData[sec.id]
                      if (!valor || valor.length === 0) return null
                      return (
                        <div key={sec.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-[#F0EAE0]' : ''}`}>
                          <span className="text-sm text-[#888882] w-40 shrink-0">{sec.label}</span>
                          <span className="text-sm flex-1 text-right">
                            <ValorPerfil id={sec.id} valor={valor} tipo={sec.tipo} />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <Link href="/perfil"
                    className="inline-block bg-[#111110] text-[#F7F3EC] text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#333330] transition-colors">
                    Actualizar perfil →
                  </Link>
                  <p className="text-xs text-[#B0AAA0] mt-3">Al actualizar verás nuevas ayudas según tu perfil actual.</p>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E0DAD0] p-8 text-center">
                  <p className="text-[#888882] mb-4">Aún no has completado tu perfil.</p>
                  <Link href="/perfil"
                    className="inline-block bg-[#E8540A] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#d14a08] transition-colors">
                    Completar perfil →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab: Suscripción */}
          {tab === 'pagos' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-[#111110]">Plan actual</h2>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full
                    ${plan === 'free' ? 'bg-[#F0EAE0] text-[#888882]' : 'bg-[#E8F5EE] text-[#1A7A4A]'}`}>
                    {plan === 'free' ? 'Gratuito' : plan === 'alertas' ? 'Alertas · 0,99€/mes' : 'Pro'}
                  </span>
                </div>
                {plan === 'free' ? (
                  <>
                    <p className="text-sm text-[#888882] mb-4">Consulta puntual sin alertas automáticas.</p>
                    <Link href="/precios"
                      className="inline-block bg-[#E8540A] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#d14a08] transition-colors">
                      Activar alertas por 0,99€/mes →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#888882] mb-4">Recibirás alertas semanales cuando abran convocatorias que aplican a tu perfil.</p>
                    <button className="text-sm text-red-500 hover:text-red-700 transition-colors">
                      Cancelar suscripción
                    </button>
                  </>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-[#111110]">Facturas y pagos</h2>
                </div>
                <p className="text-sm text-[#888882] mb-4">Descarga tus facturas, actualiza tu método de pago o cancela tu suscripción.</p>
                <button onClick={handlePortalFacturacion}
                  className="inline-block bg-[#111110] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
                  Gestionar facturación →
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-3">¿Eres gestoría?</h2>
                <p className="text-sm text-[#888882] mb-4">Accede a planes profesionales para gestionar ayudas de varios clientes.</p>
                <Link href="/precios"
                  className="inline-block bg-[#111110] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
                  Ver planes gestoría →
                </Link>
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
                    <span className="text-[#111110] font-medium">
                      {new Date(session?.user?.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Cambiar contraseña */}
                {!cambiandoPassword ? (
                  <button onClick={() => setCambiandoPassword(true)}
                    className="text-sm text-[#1A7A4A] font-medium underline">
                    Cambiar contraseña
                  </button>
                ) : (
                  <form onSubmit={handleCambiarPassword} className="mt-4 space-y-3">
                    <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                    {passwordMsg && <p className={`text-sm ${passwordMsg.includes('Error') ? 'text-red-600' : 'text-[#1A7A4A]'}`}>{passwordMsg}</p>}
                    <div className="flex gap-2">
                      <button type="submit"
                        className="bg-[#111110] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
                        Guardar
                      </button>
                      <button type="button" onClick={() => { setCambiandoPassword(false); setPasswordMsg('') }}
                        className="text-sm text-[#888882] px-5 py-2.5 rounded-full border border-[#E0DAD0] hover:border-[#C0BAB0] transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-3">Eliminar cuenta</h2>
                <p className="text-sm text-[#888882] mb-4">Si eliminas tu cuenta se borrarán todos tus datos permanentemente.</p>
                <a href="mailto:hola@cobratelo.es?subject=Solicitud eliminación de cuenta"
                  className="text-sm text-red-500 hover:text-red-700 transition-colors underline">
                  Solicitar eliminación de cuenta
                </a>
              </div>

              <button onClick={handleLogout}
                className="w-full py-3.5 rounded-full border border-[#E0DAD0] text-[#888882] font-medium hover:border-[#C0BAB0] transition-colors text-sm">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
