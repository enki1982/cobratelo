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

function Stat({ label, value, sub, color = '#111110' }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0DAD0] p-5">
      <p className="text-xs text-[#888882] uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#888882] mt-1">{sub}</p>}
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
  const [filtroPlan, setFiltroPlan] = useState('')

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
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-[#F7F3EC]">
        {/* Header */}
        <div className="bg-[#111110] text-white px-6 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-display font-bold text-lg">
                cóbratelo<span className="text-[#1A7A4A]">.es</span>
              </Link>
              <span className="text-white/30">/</span>
              <span className="text-white/70 text-sm">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1A7A4A] animate-pulse" />
              <span className="text-xs text-white/50">Live</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-full p-1 mb-8 w-fit">
            {[{id:'overview',label:'Resumen'},{id:'usuarios',label:`Usuarios (${usuarios.length})`},{id:'facturacion',label:'Facturación'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t.id ? 'bg-[#111110] text-white' : 'text-[#888882] hover:text-[#111110]'}`}>
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
                <Stat label="Esta semana" value={`+${stats.semana}`} sub="nuevos registros" color="#1A7A4A" />
                <Stat label="Este mes" value={`+${stats.mes}`} sub="nuevos registros" />
                <Stat label="Planes activos" value={stats.billing.suscripciones} sub="suscripciones Stripe" color="#1A7A4A" />
              </div>

              {/* Distribución planes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                  <h2 className="font-semibold text-[#111110] mb-4">Distribución de planes</h2>
                  <div className="space-y-3">
                    {Object.entries(stats.planes).map(([plan, count]) => (
                      <div key={plan} className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-20 text-center ${PLAN_COLOR[plan]}`}>{plan}</span>
                        <div className="flex-1 bg-[#F0EAE0] rounded-full h-2">
                          <div className="bg-[#1A7A4A] h-2 rounded-full transition-all"
                            style={{ width: stats.total ? `${(count/stats.total)*100}%` : '0%' }} />
                        </div>
                        <span className="text-sm font-semibold text-[#111110] w-8 text-right">{count}</span>
                        <span className="text-xs text-[#888882] w-10">({stats.total ? Math.round((count/stats.total)*100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                  <h2 className="font-semibold text-[#111110] mb-4">Tipo de usuario</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Particulares', value: stats.particulares, color: '#1A7A4A' },
                      { label: 'Con gestoría', value: stats.gestores, color: '#3B82F6' },
                      { label: 'Buscan gestoría', value: stats.quieren_gestor, color: '#F59E0B' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-sm text-[#555550] w-32">{item.label}</span>
                        <div className="flex-1 bg-[#F0EAE0] rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: stats.total ? `${(item.value/stats.total)*100}%` : '0%', backgroundColor: item.color }} />
                        </div>
                        <span className="text-sm font-semibold text-[#111110] w-8 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gráfico registros últimos 30 días */}
              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-4">Registros últimos 30 días</h2>
                <div className="flex items-end gap-1 h-32">
                  {Object.entries(stats.porDia).map(([fecha, count]) => {
                    const d = new Date(fecha)
                    const label = d.getDate() === 1 || d.getDay() === 0 ? `${d.getDate()}/${d.getMonth()+1}` : ''
                    return (
                      <div key={fecha} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 bg-[#111110] text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                          {fecha}: {count} registros
                        </div>
                        <div className="w-full rounded-t transition-all hover:opacity-80"
                          style={{ height: `${(count/maxDia)*100}%`, minHeight: count > 0 ? '4px' : '1px', backgroundColor: count > 0 ? '#1A7A4A' : '#E0DAD0' }} />
                        {label && <span className="text-[9px] text-[#B0AAA0] rotate-0 whitespace-nowrap">{label}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* USUARIOS */}
          {tab === 'usuarios' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex gap-3 flex-wrap">
                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por email, localidad, situación..."
                  className="flex-1 min-w-64 px-4 py-2.5 rounded-2xl border border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-sm transition-colors" />
                <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl border border-[#E0DAD0] bg-white text-sm focus:outline-none focus:border-[#1A7A4A]">
                  <option value="">Todos los planes</option>
                  <option value="free">Free</option>
                  <option value="alertas">Alertas</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
                <span className="text-sm text-[#888882] self-center">{usuariosFiltrados.length} resultados</span>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F0EAE0] bg-[#F7F3EC]">
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Plan</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Registro</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Situación</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Ingresos</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Localidad</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Gestoría</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Edad</th>
                        <th className="text-left px-4 py-3 text-xs text-[#888882] uppercase tracking-wide font-medium">Perfil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((u, i) => (
                        <tr key={u.id} className={`border-b border-[#F0EAE0] hover:bg-[#FAFAF8] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FDFCFA]'}`}>
                          <td className="px-4 py-3 font-medium text-[#111110]">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLOR[u.plan] || PLAN_COLOR.free}`}>{u.plan}</span>
                          </td>
                          <td className="px-4 py-3 text-[#888882] whitespace-nowrap">
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
                    <div className="text-center py-12 text-[#888882]">No hay usuarios con estos filtros</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FACTURACIÓN */}
          {tab === 'facturacion' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat label="Facturación hoy" value={`${stats.billing.hoy.toFixed(2)}€`} color="#1A7A4A" />
                <Stat label="Facturación 7 días" value={`${stats.billing.semana.toFixed(2)}€`} color="#1A7A4A" />
                <Stat label="Facturación 30 días" value={`${stats.billing.mes.toFixed(2)}€`} color="#1A7A4A" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Stat label="Suscripciones activas" value={stats.billing.suscripciones} sub="en Stripe" />
                <Stat label="MRR estimado" value={`${(stats.planes.alertas * 0.99 + stats.planes.pro * 49).toFixed(2)}€`} sub="basado en planes activos" color="#1A7A4A" />
              </div>
              <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
                <h2 className="font-semibold text-[#111110] mb-2">Desglose por plan</h2>
                <p className="text-xs text-[#888882] mb-4">Basado en usuarios en BD — la facturación real está en Stripe Dashboard</p>
                <div className="space-y-3">
                  {[
                    { plan: 'Alertas (0,99€/mes)', count: stats.planes.alertas, precio: 0.99 },
                    { plan: 'Starter', count: stats.planes.starter, precio: 9.99 },
                    { plan: 'Pro (49€/mes)', count: stats.planes.pro, precio: 49 },
                  ].map(row => (
                    <div key={row.plan} className="flex items-center justify-between py-2 border-b border-[#F0EAE0] last:border-0">
                      <span className="text-sm text-[#555550]">{row.plan}</span>
                      <div className="flex gap-6 text-sm">
                        <span className="text-[#888882]">{row.count} usuarios</span>
                        <span className="font-semibold text-[#1A7A4A]">{(row.count * row.precio).toFixed(2)}€/mes</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#E0DAD0] flex justify-between">
                  <span className="font-semibold text-[#111110]">MRR total estimado</span>
                  <span className="font-display text-xl font-bold text-[#1A7A4A]">
                    {(stats.planes.alertas * 0.99 + stats.planes.starter * 9.99 + stats.planes.pro * 49).toFixed(2)}€
                  </span>
                </div>
              </div>
              <div className="bg-[#F0EAE0] rounded-2xl p-4 text-sm text-[#888882]">
                Para la facturación real con detalles de cada cobro, facturas y gestión de suscripciones → <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#1A7A4A] underline">Stripe Dashboard →</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
