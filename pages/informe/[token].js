import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const LABELS = {
  empleado:'Empleado/a',autonomo:'Autónomo/a',desempleado:'En paro',pensionista:'Pensionista',
  estudiante:'Estudiante',emprendedor:'Emprendedor/a',soltero:'Soltero/a',casado:'Casado/a o pareja',
  divorciado:'Divorciado/a',viudo:'Viudo/a',hijos_menores3:'Hijos <3 años',hijos_3_18:'Hijos 3-18 años',
  familia_numerosa:'Familia numerosa',monoparental:'Monoparental',embarazada:'Embarazada',
  dependiente_cargo:'Dependiente a cargo',alquiler:'Alquiler',propietario:'Propiedad',hipoteca:'Hipoteca',
  sin_ingresos:'<8.000€/año',bajos:'8.000–15.000€',medios:'15.000–30.000€',altos:'>30.000€',
  discapacidad:'Discapacidad',dependencia:'Dependencia',victima_violencia:'Víctima violencia',
  inmigrante:'Inmigrante',rural:'Zona rural',ninguna:'Sin especial',
  sin_vehiculo:'Sin vehículo',coche_gasolina:'Coche gasolina',coche_electrico:'Coche eléctrico',
  mascotas:'Mascotas',energia:'Eficiencia energética',salud_cronica:'Enfermedad crónica',
  gafas_audifonos:'Gafas/audífonos',estudios_hijos:'Hijos en edad escolar',pyme:'Empresa/pyme',
}

const TIPO_COLOR = {
  subvencion:'bg-green-50 text-green-700',deduccion:'bg-blue-50 text-blue-700',
  prestacion:'bg-purple-50 text-purple-700',prestamo:'bg-yellow-50 text-yellow-700',
  bonificacion:'bg-orange-50 text-orange-700',
}

export default function Informe() {
  const router = useRouter()
  const { token } = router.query
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) return
    supabase.from('informes').select('*').eq('token', token).single()
      .then(({ data, error }) => {
        if (error || !data) { setError(true) } else { setDatos(data) }
        setLoading(false)
      })
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !datos) return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[#888882] mb-4">Este informe no existe o ha expirado.</p>
        <Link href="/" className="text-[#1A7A4A] underline">Ir a Cóbratelo.es</Link>
      </div>
    </div>
  )

  const { perfil, ayudas, nombre_cliente, created_at } = datos
  const fecha = new Date(created_at).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })
  const puebloObj = (() => { try { return JSON.parse((perfil.pueblo||['{}'])[0]) } catch { return {} } })()
  const resumenPerfil = [
    ...(perfil.situacion||[]), ...(perfil.familia||[]).filter(v=>v!=='sin_cargas'),
    ...(perfil.vivienda||[]), ...(perfil.especial||[]).filter(v=>v!=='ninguna'),
  ].map(v=>LABELS[v]||v).filter(Boolean).slice(0,8)

  return (
    <>
      <Head><title>Informe de ayudas — Cóbratelo.es</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <div className="bg-[#111110] text-white px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="font-display text-xl font-bold text-white mb-5 block">
              cóbratelo<span className="text-[#1A7A4A]">.es</span>
            </Link>
            <h1 className="font-display text-3xl font-bold mb-1">Informe de ayudas públicas</h1>
            {nombre_cliente && <p className="text-white/70">Cliente: <span className="text-white font-medium">{nombre_cliente}</span></p>}
            <p className="text-white/40 text-sm mt-1">Generado el {fecha} · Válido 30 días</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
          {/* Perfil */}
          <div className="bg-white rounded-2xl border border-[#E0DAD0] p-5">
            <h2 className="font-semibold text-[#111110] mb-3 text-sm uppercase tracking-wide text-[#888882]">Perfil del cliente</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {resumenPerfil.map((v,i) => <span key={i} className="text-xs bg-[#F0EAE0] text-[#555550] px-3 py-1 rounded-full">{v}</span>)}
            </div>
            <div className="flex gap-4 mt-2 text-sm text-[#888882]">
              {puebloObj.nombre && <span>📍 {puebloObj.nombre}, {puebloObj.provincia}</span>}
              {perfil.ingresos?.[0] && <span>💰 {LABELS[perfil.ingresos[0]]||perfil.ingresos[0]}</span>}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="font-display text-4xl font-bold text-[#1A7A4A]">{ayudas.length}</div>
            <div>
              <p className="font-semibold text-[#111110]">ayudas identificadas</p>
              <p className="text-sm text-[#888882]">Listas para tramitar</p>
            </div>
          </div>

          {/* Ayudas */}
          {ayudas.map((a,i) => (
            <div key={i} className="ayuda-card bg-white rounded-2xl border border-[#E0DAD0] p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 flex-wrap mb-1">
                    {a.tipo && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLOR[a.tipo]||'bg-gray-50 text-gray-600'}`}>{a.tipo}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.estado==='abierta'?'bg-green-50 text-green-700':'bg-gray-50 text-gray-500'}`}>
                      {a.estado==='abierta'?'● Abierta':a.estado||'Permanente'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#111110] leading-snug">{a.nombre}</h3>
                  <p className="text-xs text-[#888882] mt-0.5">{a.organismo}</p>
                </div>
                {a.importe_max > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-[#1A7A4A]">Hasta {a.importe_max.toLocaleString('es-ES')}€</p>
                  </div>
                )}
              </div>
              {a.descripcion && <p className="text-sm text-[#666660] mb-3 leading-relaxed">{a.descripcion}</p>}
              {a.url_oficial && (
                <a href={a.url_oficial} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-[#1A7A4A] hover:text-[#145e39] transition-colors">
                  Ver convocatoria oficial →
                </a>
              )}
            </div>
          ))}

          <p className="text-center text-xs text-[#B0AAA0] pt-2 pb-8">
            Resultados orientativos. Consulta siempre las fuentes oficiales.<br/>
            Cóbratelo.es · KIESBROTER SL (NIF: B65417107) · Mataró, Barcelona
          </p>
        </div>
      </div>
    </>
  )
}
