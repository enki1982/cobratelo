import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = 'mikinogueras@gmail.com'

const PLAN_COLOR = {
  free: 'bg-gray-100 text-gray-600',
  alertas: 'bg-green-50 text-green-700',
  starter: 'bg-blue-50 text-blue-700',
  pro: 'bg-purple-50 text-purple-700',
}

const PLAN_LABEL = {
  free: 'Gratuito',
  alertas: 'Alertas',
  starter: 'Gestoría Básico',
  pro: 'Gestoría Pro',
}

const PLAN_PRECIO = {
  free: 0,
  alertas: 0,
  starter: 149,
  pro: 399,
}

function Stat({ label, value, sub, color = '#1a0d00' }) {
  return (
    <div className="bg-white rounded-2xl border border-[#F5C89A] p-5">
      <p className="text-xs text-[#7a4a1a] uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#7a4a1a] mt-1">{sub}</p>}
    </div>
  )
}

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [stats, setStats] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [tab, setTab] = useState('overview')
  const [busqueda, setBusqueda] = useState('')
  const [metricas, setMetricas] = useState(null)
  const [filtroPlan, setFiltroPlan] = useState('')

  useEffect(() => {
    if (tab !== 'metricas' || metricas) return
    const fetchMetricas = async () => {
      const ACCIONES = ['QUESTIONNAIRE_COMPLETED','MATCH_FOUND','GESTORIA_REQUESTED','CREATE_CONSENT','GESTORIA_ACCEPTED','EXPEDIENT_CREATED','HELP_GRANTED','REVOKE_CONSENT']
      const counts = await Promise.all(ACCIONES.map(a =>
        supabase.from('access_logs').select('id', { count: 'exact', head: true }).eq('action', a)
      ))
      const m = {}
      ACCIONES.forEach((a, i) => { m[a] = counts[i].count || 0 })
      // Usuarios totales y gestorías activas
      const { count: ciudadanos } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('role', 'ciudadano')
      const { count: gestoriasActivas } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).in('plan', ['starter', 'pro'])
      const { count: consentimientos } = await supabase.from('consentimientos_gestor').select('id', { count: 'exact', head: true }).eq('activo', true)
      m._ciudadanos = ciudadanos || 0
      m._gestoriasActivas = gestoriasActivas || 0
      m._consentimientos = consentimientos || 0
      setMetricas(m)
    }
    fetchMetricas()
  }, [tab])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setToken(session.access_token)
      const headers = { Authorization: `Bearer ${session.access_token}` }
      const [sRes, uRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
      ])
      if (sRes.ok) setStats(await sRes.json())
      if (uRes.ok) setUsuarios((await uRes.json()).usuarios || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FFE2C4] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#cc5500] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = !busqueda || u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.localidad.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.situacion.toLowerCase().includes(busqueda.toLowerCase())
    const matchPlan = !filtroPlan || u.plan === filtroPlan
    return matchBusqueda && matchPlan
  })

  const maxDia = stats ? Math.max(...Object.values(stats.porDia), 1) : 1

  return (
    <>
      <Head><title>Admin — Cóbratelo.es</title></Head>
      <div className="min-h-screen bg-[#FFE2C4]">
        {/* Header */}
        <div className="bg-[#1a0d00] text-white px-6 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-display font-bold text-lg">
                cóbratelo<span className="text-[#cc5500]">.es</span>
              </Link>
              <span className="text-white/30">/</span>
              <span className="text-white/70 text-sm">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#cc5500] animate-pulse" />
              <span className="text-xs text-white/50">Live</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#F5C89A] rounded-full p-1 mb-8 w-fit">
            {[{id:'overview',label:'Resumen'},{id:'metricas',label:'Métricas'},{id:'usuarios',label:`Usuarios (${usuarios.length})`},{id:'facturacion',label:'Facturación'},{id:'rgpd',label:'RGPD'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t.id ? 'bg-[#1a0d00] text-white' : 'text-[#7a4a1a] hover:text-[#1a0d00]'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Usuarios totales" value={stats.total} sub={`+${stats.hoy} hoy`} />
                <Stat label="Esta semana" value={`+${stats.semana}`} sub="nuevos registros" color="#cc5500" />
                <Stat label="Este mes" value={`+${stats.mes}`} sub="nuevos registros" />
                <Stat label="Planes activos" value={stats.billing.suscripciones} sub="suscripciones Stripe" color="#cc5500" />
              </div>

              {/* Distribución planes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#F5C89A] p-6">
                  <h2 className="font-semibold text-[#1a0d00] mb-4">Distribución de planes</h2>
                  <div className="space-y-3">
                    {Object.entries(stats.planes).map(([plan, count]) => (
                      <div key={plan} className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-28 text-center ${PLAN_COLOR[plan]}`}>{PLAN_LABEL[plan] || plan}</span>
                        <div className="flex-1 bg-[#F0EAE0] rounded-full h-2">
                          <div className="bg-[#cc5500] h-2 rounded-full transition-all"
                            style={{ width: stats.total ? `${(count/stats.total)*100}%` : '0%' }} />
                        </div>
                        <span className="text-sm font-semibold text-[#1a0d00] w-8 text-right">{count}</span>
                        <span className="text-xs text-[#7a4a1a] w-10">({stats.total ? Math.round((count/stats.total)*100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#F5C89A] p-6">
                  <h2 className="font-semibold text-[#1a0d00] mb-4">Tipo de usuario</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Particulares', value: stats.particulares, color: '#cc5500' },
                      { label: 'Con gestoría', value: stats.gestores, color: '#3B82F6' },
                      { label: 'Buscan gestoría', value: stats.quieren_gestor, color: '#F59E0B' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-sm text-[#555550] w-32">{item.label}</span>
                        <div className="flex-1 bg-[#F0EAE0] rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: stats.total ? `${(item.value/stats.total)*100}%` : '0%', backgroundColor: item.color }} />
                        </div>
                        <span className="text-sm font-semibold text-[#1a0d00] w-8 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gráfico registros últimos 30 días */}
              <div className="bg-white rounded-2xl border border-[#F5C89A] p-6">
                <h2 className="font-semibold text-[#1a0d00] mb-4">Registros últimos 30 días</h2>
                <div className="flex items-end gap-1 h-32">
                  {Object.entries(stats.porDia).map(([fecha, count]) => {
                    const d = new Date(fecha)
                    const label = d.getDate() === 1 || d.getDay() === 0 ? `${d.getDate()}/${d.getMonth()+1}` : ''
                    return (
                      <div key={fecha} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 bg-[#1a0d00] text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                          {fecha}: {count} registros
                        </div>
                        <div className="w-full rounded-t transition-all hover:opacity-80"
                          style={{ height: `${(count/maxDia)*100}%`, minHeight: count > 0 ? '4px' : '1px', backgroundColor: count > 0 ? '#cc5500' : '#F5C89A' }} />
                        {label && <span className="text-[9px] text-[#B0AAA0] rotate-0 whitespace-nowrap">{label}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* USUARIOS */}
          {tab === 'metricas' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a0d00' }}>Métricas del negocio</h2>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Datos en tiempo real. Actualiza al cambiar de tab.</p>
              {!metricas ? <p style={{ color: '#888' }}>Cargando...</p> : (() => {
                const OBJETIVOS = [
                  { key: '_ciudadanos', label: 'Ciudadanos registrados', objetivo: 'Crecimiento semanal', valor: metricas._ciudadanos, color: '#3b82f6' },
                  { key: 'QUESTIONNAIRE_COMPLETED', label: 'Cuestionarios completados', objetivo: '>70% de registrados', valor: metricas.QUESTIONNAIRE_COMPLETED, color: '#06b6d4', pct: metricas._ciudadanos > 0 ? Math.round(100*metricas.QUESTIONNAIRE_COMPLETED/metricas._ciudadanos) : 0 },
                  { key: 'MATCH_FOUND', label: 'Con matches generados', objetivo: '>80% de cuestionarios', valor: metricas.MATCH_FOUND, color: '#8b5cf6', pct: metricas.QUESTIONNAIRE_COMPLETED > 0 ? Math.round(100*metricas.MATCH_FOUND/metricas.QUESTIONNAIRE_COMPLETED) : 0 },
                  { key: 'GESTORIA_REQUESTED', label: 'Solicitudes a gestoría', objetivo: '>20% de matches', valor: metricas.GESTORIA_REQUESTED, color: '#f59e0b', pct: metricas.MATCH_FOUND > 0 ? Math.round(100*metricas.GESTORIA_REQUESTED/metricas.MATCH_FOUND) : 0 },
                  { key: '_consentimientos', label: 'Consentimientos activos', objetivo: '>15% de registrados', valor: metricas._consentimientos, color: '#f97316', pct: metricas._ciudadanos > 0 ? Math.round(100*metricas._consentimientos/metricas._ciudadanos) : 0 },
                  { key: 'EXPEDIENT_CREATED', label: 'Expedientes creados', objetivo: '>10% de solicitudes', valor: metricas.EXPEDIENT_CREATED, color: '#22c55e', pct: metricas.GESTORIA_REQUESTED > 0 ? Math.round(100*metricas.EXPEDIENT_CREATED/metricas.GESTORIA_REQUESTED) : 0 },
                  { key: '_gestoriasActivas', label: 'Gestorías activas (pago)', objetivo: 'Crecimiento continuo', valor: metricas._gestoriasActivas, color: '#10b981' },
                  { key: 'HELP_GRANTED', label: 'Ayudas concedidas', objetivo: 'Métrica de éxito final', valor: metricas.HELP_GRANTED, color: '#16a34a' },
                ]
                const maxVal = Math.max(...OBJETIVOS.map(m => m.valor), 1)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {OBJETIVOS.map(m => (
                      <div key={m.key} style={{ background: '#fff', border: '1px solid #f0e8dc', borderRadius: 12, padding: '14px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a0d00' }}>{m.label}</span>
                            <span style={{ fontSize: 12, color: '#aaa', marginLeft: 10 }}>Objetivo: {m.objetivo}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            {m.pct !== undefined && <span style={{ fontSize: 13, color: m.pct >= parseInt(m.objetivo) ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{m.pct}%</span>}
                            <span style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.valor.toLocaleString('es-ES')}</span>
                          </div>
                        </div>
                        <div style={{ background: '#f0e8dc', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: Math.max(2, Math.round(m.valor/maxVal*100))+'%', background: m.color, height: '100%', borderRadius: 99, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                    {metricas.REVOKE_CONSENT > 0 && (
                      <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#dc2626' }}>⚠️ Consentimientos revocados</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{metricas.REVOKE_CONSENT}</span>
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center' }}>Los % se calculan respecto al paso anterior del funnel</p>
                  </div>
                )
              })()}
            </div>
          )}

          {tab === 'usuarios' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex gap-3 flex-wrap">
                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por email, localidad, situación..."
                  className="flex-1 min-w-64 px-4 py-2.5 rounded-2xl border border-[#F5C89A] bg-white focus:outline-none focus:border-[#cc5500] text-sm transition-colors" />
                <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl border border-[#F5C89A] bg-white text-sm focus:outline-none focus:border-[#cc5500]">
                  <option value="">Todos los planes</option>
                  <option value="free">Free</option>
                  <option value="alertas">Alertas</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
                <span className="text-sm text-[#7a4a1a] self-center">{usuariosFiltrados.length} resultados</span>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl border border-[#F5C89A] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F0EAE0] bg-[#FFE2C4]">
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Plan</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Registro</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Situación</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Ingresos</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Localidad</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Gestoría</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Edad</th>
                        <th className="text-left px-4 py-3 text-xs text-[#7a4a1a] uppercase tracking-wide font-medium">Perfil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((u, i) => (
                        <tr key={u.id} className={`border-b border-[#F0EAE0] hover:bg-[#FAFAF8] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FDFCFA]'}`}>
                          <td className="px-4 py-3 font-medium text-[#1a0d00]">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLOR[u.plan] || PLAN_COLOR.free}`}>{PLAN_LABEL[u.plan] || u.plan}</span>
                          </td>
                          <td className="px-4 py-3 text-[#7a4a1a] whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-[#555550]">{u.situacion || '—'}</td>
                          <td className="px-4 py-3 text-[#555550]">{u.ingresos || '—'}</td>
                          <td className="px-4 py-3 text-[#555550]">{u.localidad || '—'}</td>
                          <td className="px-4 py-3 text-[#555550]">{u.gestoria || '—'}</td>
                          <td className="px-4 py-3 text-[#555550]">{u.edad ? `${u.edad} años` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.tiene_perfil ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                              {u.tiene_perfil ? '✓' : 'Sin perfil'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usuariosFiltrados.length === 0 && (
                    <div className="text-center py-12 text-[#7a4a1a]">No hay usuarios con estos filtros</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FACTURACIÓN */}
          {tab === 'rgpd' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#888', marginBottom: 16 }}>Abriendo el centro de cumplimiento RGPD...</p>
              <a href="/admin/rgpd" style={{ background: '#cc5500', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 99, fontWeight: 600 }}>Ir a RGPD →</a>
            </div>
          )}

          {tab === 'facturacion' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat label="Facturación hoy" value={`${stats.billing.hoy.toFixed(2)}€`} color="#cc5500" />
                <Stat label="Facturación 7 días" value={`${stats.billing.semana.toFixed(2)}€`} color="#cc5500" />
                <Stat label="Facturación 30 días" value={`${stats.billing.mes.toFixed(2)}€`} color="#cc5500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Stat label="Suscripciones activas" value={stats.billing.suscripciones} sub="en Stripe" />
                <Stat label="MRR estimado" value={`${(stats.planes.starter * 149 + stats.planes.pro * 399).toFixed(2)}€`} sub="basado en planes activos" color="#cc5500" />
              </div>
              <div className="bg-white rounded-2xl border border-[#F5C89A] p-6">
                <h2 className="font-semibold text-[#1a0d00] mb-2">Desglose por plan</h2>
                <p className="text-xs text-[#7a4a1a] mb-4">Basado en usuarios en BD — la facturación real está en Stripe Dashboard</p>
                <div className="space-y-3">
                  {[
                    { plan: 'Gestoría Básico (149€/mes)', count: stats.planes.starter, precio: 149 },
                    { plan: 'Gestoría Pro (399€/mes)', count: stats.planes.pro, precio: 399 },
                  ].map(row => (
                    <div key={row.plan} className="flex items-center justify-between py-2 border-b border-[#F0EAE0] last:border-0">
                      <span className="text-sm text-[#555550]">{row.plan}</span>
                      <div className="flex gap-6 text-sm">
                        <span className="text-[#7a4a1a]">{row.count} usuarios</span>
                        <span className="font-semibold text-[#cc5500]">{(row.count * row.precio).toFixed(2)}€/mes</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#F5C89A] flex justify-between">
                  <span className="font-semibold text-[#1a0d00]">MRR total estimado</span>
                  <span className="font-display text-xl font-bold text-[#cc5500]">
                    {(stats.planes.starter * 149 + stats.planes.pro * 399).toFixed(2)}€
                  </span>
                </div>
              </div>
              <div className="bg-[#F0EAE0] rounded-2xl p-4 text-sm text-[#7a4a1a]">
                Para la facturación real con detalles de cada cobro, facturas y gestión de suscripciones → <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#cc5500] underline">Stripe Dashboard →</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
