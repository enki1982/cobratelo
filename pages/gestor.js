import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#0f0a00',
  surface: '#1a1000',
  card: '#221500',
  border: 'rgba(255,200,120,0.12)',
  text: '#FFF5EB',
  muted: 'rgba(255,245,235,0.45)',
  orange: '#cc5500',
  green: '#4DB62A',
}

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  activo: { label: 'Activo', color: '#4DB62A', bg: 'rgba(77,182,42,0.1)' },
  gestionado: { label: 'Gestionado', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  descartado: { label: 'Descartado', color: 'rgba(255,245,235,0.3)', bg: 'rgba(255,245,235,0.05)' },
}

export default function GestorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [clienteDetalle, setClienteDetalle] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [token, setToken] = useState(null)

  // Formulario nuevo cliente
  const [form, setForm] = useState({ cliente_email: '', cliente_nombre: '', dni: '', telefono: '', notas: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      const { data } = await supabase.from('usuarios').select('plan').eq('id', session.user.id).single()
      if (!['starter', 'pro'].includes(data?.plan)) {
        router.push('/precios')
        return
      }
      setPlan(data.plan)
      cargarClientes(session.access_token)
    })
  }, [])

  const cargarClientes = async (tok) => {
    try {
      const res = await fetch('/api/gestor/clientes', {
        headers: { Authorization: `Bearer ${tok}` }
      })
      const json = await res.json()
      setClientes(json.clientes || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const añadirCliente = async () => {
    if (!form.cliente_email) return
    setGuardando(true)
    try {
      const res = await fetch('/api/gestor/clientes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (json.error) { alert(json.error); return }
      setClientes(prev => [json.cliente, ...prev])
      setModalNuevo(false)
      setForm({ cliente_email: '', cliente_nombre: '', dni: '', telefono: '', notas: '' })
    } catch (e) { alert('Error al añadir cliente') }
    finally { setGuardando(false) }
  }

  const actualizarEstado = async (id, estado) => {
    await fetch('/api/gestor/clientes', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado })
    })
    setClientes(prev => prev.map(c => c.id === id ? { ...c, estado } : c))
    if (clienteDetalle?.id === id) setClienteDetalle(prev => ({ ...prev, estado }))
  }

  const actualizarCliente = async (id, updates) => {
    const res = await fetch('/api/gestor/clientes', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    const json = await res.json()
    setClientes(prev => prev.map(c => c.id === id ? json.cliente : c))
    setClienteDetalle(json.cliente)
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await fetch(`/api/gestor/clientes?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    setClientes(prev => prev.filter(c => c.id !== id))
    setClienteDetalle(null)
  }

  const clientesFiltrados = clientes.filter(c => {
    const matchFiltro = filtro === 'todos' || c.estado === filtro
    const matchBusqueda = !busqueda ||
      c.cliente_email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const stats = {
    total: clientes.length,
    activos: clientes.filter(c => c.estado === 'activo').length,
    gestionados: clientes.filter(c => c.estado === 'gestionado').length,
    pendientes: clientes.filter(c => c.estado === 'pendiente').length,
  }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontSize: 14 }}>Cargando panel...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Panel Gestoría — Cóbratelo.es</title>
      </Head>
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ color: C.orange, fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>
              cóbratelo<span style={{ color: C.text }}>.es</span>
            </a>
            <span style={{ color: C.muted, fontSize: 13 }}>/ Panel Gestoría</span>
            <span style={{ background: 'rgba(77,182,42,0.1)', color: C.green, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(77,182,42,0.2)' }}>
              {plan === 'pro' ? 'Pro' : 'Básico'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/cuenta" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Mi cuenta</a>
            <button onClick={() => setModalNuevo(true)}
              style={{ background: C.orange, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Añadir cliente
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total clientes', value: stats.total, limit: plan === 'starter' ? 50 : '∞' },
              { label: 'Activos', value: stats.activos, color: C.green },
              { label: 'Gestionados', value: stats.gestionados, color: '#60a5fa' },
              { label: 'Pendientes', value: stats.pendientes, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color || C.text, lineHeight: 1 }}>
                  {s.value}
                  {s.limit && <span style={{ fontSize: 14, color: C.muted, fontWeight: 400, marginLeft: 4 }}>/ {s.limit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Filtros y búsqueda */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email..."
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 100, padding: '8px 16px', color: C.text, fontSize: 13, width: 260, outline: 'none' }}
            />
            {['todos', 'activo', 'pendiente', 'gestionado', 'descartado'].map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 100, border: `1px solid ${filtro === f ? C.orange : C.border}`, background: filtro === f ? 'rgba(204,85,0,0.1)' : 'transparent', color: filtro === f ? C.orange : C.muted, cursor: 'pointer', textTransform: 'capitalize' }}>
                {f === 'todos' ? 'Todos' : ESTADOS[f]?.label}
              </button>
            ))}
          </div>

          {/* Lista de clientes */}
          <div style={{ display: 'grid', gap: 1 }}>
            {clientesFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
                {clientes.length === 0 ? (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>Sin clientes todavía</div>
                    <div style={{ fontSize: 13 }}>Añade tu primer cliente o espera a que un ciudadano te envíe sus ayudas.</div>
                  </>
                ) : 'No hay clientes con este filtro'}
              </div>
            ) : clientesFiltrados.map(cliente => (
              <div key={cliente.id}
                onClick={() => setClienteDetalle(cliente)}
                style={{ background: clienteDetalle?.id === cliente.id ? C.card : 'transparent', border: `1px solid ${clienteDetalle?.id === cliente.id ? C.border : 'transparent'}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,200,120,0.08)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {(cliente.cliente_nombre || cliente.cliente_email)?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>
                    {cliente.cliente_nombre || cliente.cliente_email}
                  </div>
                  {cliente.cliente_nombre && (
                    <div style={{ fontSize: 12, color: C.muted }}>{cliente.cliente_email}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {cliente.ayudas_ids?.length > 0 && (
                    <span style={{ fontSize: 12, color: C.orange, background: 'rgba(204,85,0,0.1)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(204,85,0,0.2)' }}>
                      {cliente.ayudas_ids.length} ayudas
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: ESTADOS[cliente.estado]?.color, background: ESTADOS[cliente.estado]?.bg, padding: '3px 10px', borderRadius: 100 }}>
                    {ESTADOS[cliente.estado]?.label}
                  </span>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel detalle cliente */}
      {clienteDetalle && (
        <ClienteDetalle
          cliente={clienteDetalle}
          token={token}
          onClose={() => setClienteDetalle(null)}
          onUpdateEstado={actualizarEstado}
          onUpdate={actualizarCliente}
          onDelete={eliminarCliente}
          C={C}
          ESTADOS={ESTADOS}
        />
      )}

      {/* Modal nuevo cliente */}
      {modalNuevo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1a1000', border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, maxWidth: 440, width: '100%' }}>
            <h3 style={{ margin: '0 0 24px', color: C.text, fontSize: 18, fontWeight: 700 }}>Añadir cliente</h3>
            {[
              { key: 'cliente_email', label: 'Email *', type: 'email', placeholder: 'email@cliente.com' },
              { key: 'cliente_nombre', label: 'Nombre completo', type: 'text', placeholder: 'Nombre Apellidos' },
              { key: 'dni', label: 'DNI / NIE', type: 'text', placeholder: '12345678A' },
              { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
              { key: 'notas', label: 'Notas internas', type: 'text', placeholder: 'Cualquier apunte...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setModalNuevo(false)}
                style={{ flex: 1, padding: '11px 0', borderRadius: 100, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={añadirCliente} disabled={!form.cliente_email || guardando}
                style={{ flex: 1, padding: '11px 0', borderRadius: 100, border: 'none', background: C.orange, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: !form.cliente_email ? 0.5 : 1 }}>
                {guardando ? 'Añadiendo...' : 'Añadir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ClienteDetalle({ cliente, token, onClose, onUpdateEstado, onUpdate, onDelete, C, ESTADOS }) {
  const [ayudas, setAyudas] = useState([])
  const [loadingAyudas, setLoadingAyudas] = useState(false)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    cliente_nombre: cliente.cliente_nombre || '',
    dni: cliente.dni || '',
    telefono: cliente.telefono || '',
    notas: cliente.notas || '',
  })
  const [ayudasEstado, setAyudasEstado] = useState(cliente.ayudas_estado || {})

  useEffect(() => {
    if (cliente.ayudas_ids?.length) cargarAyudas()
    setForm({
      cliente_nombre: cliente.cliente_nombre || '',
      dni: cliente.dni || '',
      telefono: cliente.telefono || '',
      notas: cliente.notas || '',
    })
    setAyudasEstado(cliente.ayudas_estado || {})
  }, [cliente.id])

  const cargarAyudas = async () => {
    setLoadingAyudas(true)
    try {
      const { data } = await supabase
        .from('ayudas')
        .select('id,nombre,organismo,tipo,estado,url_oficial,importe_max,importe_descripcion')
        .in('id', cliente.ayudas_ids)
      setAyudas(data || [])
    } catch (e) { console.error(e) }
    finally { setLoadingAyudas(false) }
  }

  const guardarEdicion = async () => {
    await onUpdate(cliente.id, form)
    setEditando(false)
  }

  const toggleAyudaEstado = async (ayudaId, nuevoEstado) => {
    const nuevo = { ...ayudasEstado, [ayudaId]: { estado: nuevoEstado, fecha: new Date().toISOString() } }
    setAyudasEstado(nuevo)
    await onUpdate(cliente.id, { ayudas_estado: nuevo })
  }

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 480, background: '#141000', borderLeft: `1px solid ${C.border}`, zIndex: 50, overflowY: 'auto', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {cliente.cliente_nombre || cliente.cliente_email}
          </div>
          {cliente.cliente_nombre && (
            <div style={{ fontSize: 12, color: C.muted }}>{cliente.cliente_email}</div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>✕</button>
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Estado</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <button key={key} onClick={() => onUpdateEstado(cliente.id, key)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, border: `1px solid ${cliente.estado === key ? val.color : C.border}`, background: cliente.estado === key ? val.bg : 'transparent', color: cliente.estado === key ? val.color : C.muted, cursor: 'pointer' }}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos personales */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Datos del cliente</div>
          <button onClick={() => editando ? guardarEdicion() : setEditando(true)}
            style={{ fontSize: 12, color: editando ? C.green : C.orange, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {editando ? '✓ Guardar' : 'Editar'}
          </button>
        </div>
        {[
          { key: 'cliente_nombre', label: 'Nombre', value: cliente.cliente_nombre },
          { key: 'dni', label: 'DNI / NIE', value: cliente.dni },
          { key: 'telefono', label: 'Teléfono', value: cliente.telefono },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{f.label}</div>
            {editando ? (
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <div style={{ fontSize: 13, color: f.value ? C.text : C.muted }}>{f.value || '—'}</div>
            )}
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Notas internas</div>
          {editando ? (
            <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              rows={3}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          ) : (
            <div style={{ fontSize: 13, color: cliente.notas ? C.text : C.muted, whiteSpace: 'pre-wrap' }}>{cliente.notas || '—'}</div>
          )}
        </div>
      </div>

      {/* Ayudas */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
          Ayudas identificadas {ayudas.length > 0 && `(${ayudas.length})`}
        </div>
        {loadingAyudas ? (
          <div style={{ color: C.muted, fontSize: 13 }}>Cargando ayudas...</div>
        ) : ayudas.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>Sin ayudas identificadas para este cliente.</div>
        ) : ayudas.map(ayuda => {
          const est = ayudasEstado[ayuda.id]?.estado || 'pendiente'
          return (
            <div key={ayuda.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{ayuda.nombre}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{ayuda.organismo}</div>
                  {ayuda.importe_max > 0 && (
                    <div style={{ fontSize: 12, color: C.orange, marginTop: 4 }}>
                      Hasta {ayuda.importe_max.toLocaleString('es-ES')}€
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <select value={est} onChange={e => toggleAyudaEstado(ayuda.id, e.target.value)}
                    style={{ fontSize: 11, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 8px', color: C.text, cursor: 'pointer' }}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_tramite">En trámite</option>
                    <option value="solicitada">Solicitada</option>
                    <option value="concedida">Concedida</option>
                    <option value="denegada">Denegada</option>
                  </select>
                  {ayuda.url_oficial && (
                    <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: C.orange, textDecoration: 'none', textAlign: 'center' }}>
                      Ver convocatoria →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Eliminar */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => onDelete(cliente.id)}
          style={{ fontSize: 12, color: 'rgba(255,100,100,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Eliminar cliente
        </button>
      </div>
    </div>
  )
}
