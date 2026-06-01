import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#F7F8FA',
  white: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#111827',
  muted: '#6B7280',
  light: '#9CA3AF',
  orange: '#cc5500',
  orangeLight: '#FFF5F0',
  orangeBorder: '#FDDCC4',
  green: '#059669',
  greenBg: '#ECFDF5',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  yellow: '#D97706',
  yellowBg: '#FFFBEB',
  red: '#DC2626',
  redBg: '#FEF2F2',
  sidebar: '#FFFFFF',
}

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: C.yellow, bg: C.yellowBg, border: '#FDE68A' },
  activo: { label: 'Activo', color: C.green, bg: C.greenBg, border: '#A7F3D0' },
  gestionado: { label: 'Gestionado', color: C.blue, bg: C.blueBg, border: '#BFDBFE' },
  descartado: { label: 'Descartado', color: C.light, bg: '#F9FAFB', border: C.border },
}

const ESTADOS_AYUDA = ['pendiente', 'en_tramite', 'documentacion', 'solicitada', 'en_espera', 'concedida', 'denegada', 'desistida']
const ESTADOS_AYUDA_LABEL = {
  pendiente: 'Pendiente',
  en_tramite: 'En trámite',
  documentacion: 'Docs. pendientes',
  solicitada: 'Solicitada',
  en_espera: 'En espera respuesta',
  concedida: '✓ Concedida',
  denegada: 'Denegada',
  desistida: 'Desistida',
}
const ESTADOS_AYUDA_COLOR = {
  pendiente: C.yellow,
  en_tramite: C.blue,
  documentacion: '#7C3AED',
  solicitada: C.orange,
  en_espera: '#0891B2',
  concedida: C.green,
  denegada: C.red,
  desistida: C.light,
}

// Dependencias de fechas: qué campo necesita cada fecha para estar disponible
const FECHA_DEPS = {
  fecha_solicitud_cliente: null,               // siempre disponible
  fecha_plazo_maximo: null,                    // siempre disponible (referencia de urgencia)
  fecha_inicio_tramite: null,                  // siempre disponible
  fecha_presentacion: 'fecha_inicio_tramite',  // requiere inicio
  fecha_resolucion: 'fecha_presentacion',      // requiere presentación
}

// Mínimo fecha de cada campo basado en la cadena lógica
const FECHA_MIN_DEP = {
  fecha_inicio_tramite: 'fecha_solicitud_cliente',
  fecha_presentacion: 'fecha_inicio_tramite',
  fecha_resolucion: 'fecha_presentacion',
}

// Qué fechas requiere cada estado
const ESTADO_REQS = {
  pendiente: [],
  en_tramite: ['fecha_inicio_tramite'],
  documentacion: ['fecha_inicio_tramite'],
  solicitada: ['fecha_inicio_tramite', 'fecha_presentacion'],
  en_espera: ['fecha_inicio_tramite', 'fecha_presentacion'],
  concedida: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
  denegada: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
  desistida: ['fecha_inicio_tramite'],
}

// Campos que dependen de un campo dado (para avisar al borrarlo)
const FECHA_CHILDREN = {
  fecha_solicitud_cliente: [],
  fecha_plazo_maximo: [],
  fecha_inicio_tramite: ['fecha_presentacion'],
  fecha_presentacion: ['fecha_resolucion'],
  fecha_resolucion: [],
}

function isFechaDisabled(campo, tramite) {
  const dep = FECHA_DEPS[campo]
  if (!dep) return false
  return !tramite[dep]
}

function getMinDate(campo, tramite) {
  const minDep = FECHA_MIN_DEP[campo]
  if (!minDep) return undefined
  return tramite[minDep] || undefined
}

function canChangeEstado(nuevoEstado, tramite) {
  const reqs = ESTADO_REQS[nuevoEstado] || []
  const faltantes = reqs.filter(r => !tramite[r])
  if (faltantes.length === 0) return { ok: true }
  const LABELS = {
    fecha_inicio_tramite: 'Inicio del trámite',
    fecha_presentacion: 'Fecha presentación',
    fecha_respuesta: 'Fecha respuesta',
  }
  return { ok: false, razon: 'Falta: ' + faltantes.map(f => LABELS[f] || f).join(', ') }
}

function getChildrenDirty(campo, tramite) {
  // Campos que se perderán si se borra este campo
  const hijos = FECHA_CHILDREN[campo] || []
  const dirty = hijos.filter(h => tramite[h])
  // recursivo: hijos de hijos
  dirty.forEach(h => {
    getChildrenDirty(h, tramite).forEach(hh => { if (!dirty.includes(hh)) dirty.push(hh) })
  })
  return dirty
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
  const [form, setForm] = useState({ cliente_email: '', cliente_nombre: '', dni: '', telefono: '', notas: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      const { data } = await supabase.from('usuarios').select('plan').eq('id', session.user.id).single()
      if (!['starter', 'pro'].includes(data?.plan)) { router.push('/precios'); return }
      setPlan(data.plan)
      cargarClientes(session.access_token)
    })
  }, [])

  const cargarClientes = async (tok) => {
    try {
      const res = await fetch('/api/gestor/clientes', { headers: { Authorization: `Bearer ${tok}` } })
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
    } catch { alert('Error al añadir cliente') }
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
    if (!confirm('¿Eliminar este cliente del panel? Esta acción no se puede deshacer.')) return
    await fetch(`/api/gestor/clientes?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
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

  const exportarCSV = () => {
    const ESTADOS_LABEL = { pendiente: 'Pendiente', activo: 'Activo', gestionado: 'Gestionado', descartado: 'Descartado' }
    const headers = ['Nombre', 'Email', 'DNI', 'Teléfono', 'Estado', 'Nº Ayudas', 'Notas', 'Fecha alta']
    const rows = clientes.map(c => [
      c.cliente_nombre || '',
      c.cliente_email || '',
      c.dni || '',
      c.telefono || '',
      ESTADOS_LABEL[c.estado] || c.estado || '',
      c.ayudas_ids?.length || 0,
      (c.notas || '').split('\n').join(' '),
      new Date(c.created_at).toLocaleDateString('es-ES'),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => { const s = String(v); return '"' + s.split('"').join('""') + '"' }).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes-cobratelo-' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontSize: 14 }}>Cargando panel...</div>
    </div>
  )

  return (
    <>
      <Head><title>Panel Gestoría — Cóbratelo.es</title></Head>
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Topbar */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, color: C.orange, textDecoration: 'none', letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: C.text }}>.es</span>
            </a>
            <span style={{ color: C.border }}>|</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <a href="/gestor/expedientes" style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>Expedientes</a>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.orange, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: C.orangeLight }}>Clientes</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, padding: '3px 10px', borderRadius: 100, border: `1px solid ${C.border}` }}>
              {plan === 'pro' ? 'Pro' : 'Básico'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/cuenta" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Mi cuenta</a>
            <button onClick={exportarCSV}
              style={{ background: 'white', color: C.orange, border: `1px solid ${C.orangeBorder}`, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ↓ Exportar CSV
            </button>
            <button onClick={() => setModalNuevo(true)}
              style={{ background: C.orange, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              + Añadir cliente
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto', padding: '24px 24px' }}>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total clientes', value: stats.total, suffix: plan === 'starter' ? '/ 50' : '', color: C.text },
                { label: 'Activos', value: stats.activos, color: C.green },
                { label: 'Gestionados', value: stats.gestionados, color: C.blue },
                { label: 'Pendientes', value: stats.pendientes, color: C.yellow },
              ].map((s, i) => (
                <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}
                    {s.suffix && <span style={{ fontSize: 14, color: C.muted, fontWeight: 400, marginLeft: 6 }}>{s.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="🔍  Buscar cliente..."
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', color: C.text, fontSize: 13, width: 240, outline: 'none' }}
              />
              <div style={{ height: 24, width: 1, background: C.border }} />
              {['todos', 'activo', 'pendiente', 'gestionado', 'descartado'].map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: `1px solid ${filtro === f ? C.orange : C.border}`, background: filtro === f ? C.orangeLight : 'transparent', color: filtro === f ? C.orange : C.muted, cursor: 'pointer', fontWeight: filtro === f ? 600 : 400 }}>
                  {f === 'todos' ? `Todos (${clientes.length})` : ESTADOS[f] ? `${ESTADOS[f].label} (${clientes.filter(c => c.estado === f).length})` : f}
                </button>
              ))}
            </div>

            {/* Tabla clientes */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Header tabla */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 100px', padding: '10px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                {['Cliente', 'Email', 'Estado', 'Ayudas'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                ))}
              </div>

              {clientesFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
                  {clientes.length === 0 ? (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>Sin clientes todavía</div>
                      <div style={{ fontSize: 13 }}>Añade tu primer cliente o espera a que uno de tus clientes<br/>te envíe sus ayudas desde la plataforma.</div>
                      <button onClick={() => setModalNuevo(true)}
                        style={{ marginTop: 20, background: C.orange, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        + Añadir primer cliente
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 14 }}>No hay clientes con este filtro</div>
                  )}
                </div>
              ) : clientesFiltrados.map((cliente, idx) => {
                const isSelected = clienteDetalle?.id === cliente.id
                const est = ESTADOS[cliente.estado] || ESTADOS.pendiente
                return (
                  <div key={cliente.id}
                    onClick={() => setClienteDetalle(isSelected ? null : cliente)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 100px', padding: '14px 20px', borderBottom: idx < clientesFiltrados.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: isSelected ? C.orangeLight : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isSelected ? C.orangeBorder : C.bg, border: `1px solid ${isSelected ? C.orange : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isSelected ? C.orange : C.muted, flexShrink: 0 }}>
                        {(cliente.cliente_nombre || cliente.cliente_email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cliente.cliente_nombre || cliente.cliente_email}</div>
                        {cliente.cliente_nombre && <div style={{ fontSize: 12, color: C.muted }}>{cliente.cliente_email}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: C.muted }}>
                      {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: est.color, background: est.bg, padding: '4px 10px', borderRadius: 100, border: `1px solid ${est.border}` }}>
                        {est.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: cliente.ayudas_ids?.length ? C.orange : C.light }}>
                      {cliente.ayudas_ids?.length || 0}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panel lateral */}
          {clienteDetalle && (
            <div style={{ width: 420, flexShrink: 0, marginLeft: 20 }}>
              <ClienteDetalle
                cliente={clienteDetalle}
                token={token}
                onClose={() => setClienteDetalle(null)}
                onUpdateEstado={actualizarEstado}
                onUpdate={actualizarCliente}
                onDelete={eliminarCliente}
                C={C} ESTADOS={ESTADOS}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {modalNuevo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', color: C.text, fontSize: 18, fontWeight: 700 }}>Añadir cliente</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: C.muted }}>Añade un cliente para hacer seguimiento de sus ayudas.</p>
            {[
              { key: 'cliente_email', label: 'Email *', type: 'email', placeholder: 'cliente@email.com' },
              { key: 'cliente_nombre', label: 'Nombre completo', type: 'text', placeholder: 'Nombre Apellidos' },
              { key: 'dni', label: 'DNI / NIE', type: 'text', placeholder: '12345678A' },
              { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
              { key: 'notas', label: 'Notas internas', type: 'text', placeholder: 'Notas privadas sobre este cliente...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalNuevo(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={añadirCliente} disabled={!form.cliente_email || guardando}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: form.cliente_email ? C.orange : C.light, color: '#fff', cursor: form.cliente_email ? 'pointer' : 'default', fontWeight: 600, fontSize: 14 }}>
                {guardando ? 'Añadiendo...' : 'Añadir cliente'}
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
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ cliente_nombre: '', dni: '', telefono: '', notas: '' })
  const [ayudasEstado, setAyudasEstado] = useState({})
  const [buscarAyuda, setBuscarAyuda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [modalBuscar, setModalBuscar] = useState(false)

  useEffect(() => {
    setForm({
      cliente_nombre: cliente.cliente_nombre || '',
      dni: cliente.dni || '',
      telefono: cliente.telefono || '',
      notas: cliente.notas || '',
    })
    setAyudasEstado(cliente.ayudas_estado || {})
    if (cliente.ayudas_ids?.length) cargarAyudas()
    else setAyudas([])
  }, [cliente.id])

  const cargarAyudas = async () => {
    setLoadingAyudas(true)
    try {
      const { data } = await supabase.from('ayudas').select('id,nombre,organismo,tipo,estado,url_oficial,importe_max').in('id', cliente.ayudas_ids)
      setAyudas(data || [])
    } finally { setLoadingAyudas(false) }
  }

  const guardar = async () => {
    setGuardando(true)
    await onUpdate(cliente.id, form)
    setGuardando(false)
    setEditando(false)
  }

  const buscarEnBD = async (q) => {
    if (!q || q.length < 3) { setResultadosBusqueda([]); return }
    setBuscando(true)
    try {
      const { data } = await supabase
        .from('ayudas')
        .select('id,nombre,organismo,tipo,estado,url_oficial,importe_max,comunidad_autonoma')
        .or(`nombre.ilike.%${q}%,organismo.ilike.%${q}%,descripcion.ilike.%${q}%`)
        .in('estado', ['abierta', 'permanente', 'pendiente'])
        .limit(8)
      setResultadosBusqueda(data || [])
    } finally { setBuscando(false) }
  }

  const añadirAyuda = async (ayuda) => {
    const idsActuales = cliente.ayudas_ids || []
    if (idsActuales.includes(ayuda.id)) {
      alert('Esta ayuda ya está en la lista del cliente')
      return
    }
    const nuevosIds = [...idsActuales, ayuda.id]
    await onUpdate(cliente.id, { ayudas_ids: nuevosIds })
    setAyudas(prev => [...prev, ayuda])
    setBuscarAyuda('')
    setResultadosBusqueda([])
    setModalBuscar(false)
  }

  const quitarAyuda = async (ayudaId) => {
    if (!confirm('¿Quitar esta ayuda del cliente?')) return
    const nuevosIds = (cliente.ayudas_ids || []).filter(id => id !== ayudaId)
    await onUpdate(cliente.id, { ayudas_ids: nuevosIds })
    setAyudas(prev => prev.filter(a => a.id !== ayudaId))
  }

  const toggleAyudaEstado = async (ayudaId, nuevoEstado) => {
    const nuevo = { ...ayudasEstado, [ayudaId]: { estado: nuevoEstado, fecha: new Date().toISOString() } }
    setAyudasEstado(nuevo)
    await onUpdate(cliente.id, { ayudas_estado: nuevo })
  }

  const est = ESTADOS[cliente.estado] || ESTADOS.pendiente

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 76, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>

      {/* Header panel */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2 }}>
            {cliente.cliente_nombre || cliente.cliente_email}
          </div>
          {cliente.cliente_nombre && <div style={{ fontSize: 12, color: C.muted }}>{cliente.cliente_email}</div>}
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: est.color, background: est.bg, padding: '3px 10px', borderRadius: 100, border: `1px solid ${est.border}` }}>
              {est.label}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14, flexShrink: 0 }}>✕</button>
      </div>

      {/* Estado */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Cambiar estado</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <button key={key} onClick={() => onUpdateEstado(cliente.id, key)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${cliente.estado === key ? val.color : C.border}`, background: cliente.estado === key ? val.bg : 'transparent', color: cliente.estado === key ? val.color : C.muted, cursor: 'pointer', fontWeight: cliente.estado === key ? 600 : 400 }}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos cliente */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos del cliente</div>
          {!editando ? (
            <button onClick={() => setEditando(true)} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Editar</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditando(false)} style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardar} style={{ fontSize: 12, color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{guardando ? 'Guardando...' : '✓ Guardar'}</button>
            </div>
          )}
        </div>
        {[
          { key: 'cliente_nombre', label: 'Nombre', value: cliente.cliente_nombre },
          { key: 'dni', label: 'DNI / NIE', value: cliente.dni },
          { key: 'telefono', label: 'Teléfono', value: cliente.telefono },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.light, marginBottom: 3 }}>{f.label}</div>
            {editando ? (
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <div style={{ fontSize: 13, color: f.value ? C.text : C.light }}>{f.value || '—'}</div>
            )}
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: C.light, marginBottom: 3 }}>Notas internas</div>
          {editando ? (
            <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={3}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '7px 10px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          ) : (
            <div style={{ fontSize: 13, color: cliente.notas ? C.text : C.light, whiteSpace: 'pre-wrap' }}>{cliente.notas || '—'}</div>
          )}
        </div>
      </div>

      {/* Ayudas */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ayudas a gestionar {ayudas.length > 0 && `(${ayudas.length})`}
          </div>
          <button onClick={() => setModalBuscar(true)}
            style={{ fontSize: 12, color: C.orange, background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            + Añadir ayuda
          </button>
        </div>

        {/* Modal buscador de ayudas */}
        {modalBuscar && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100 }}>
            <div style={{ background: C.white, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 520, maxWidth: '90vw', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Buscar ayuda para añadir</div>
                  <button onClick={() => { setModalBuscar(false); setBuscarAyuda(''); setResultadosBusqueda([]) }}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: C.muted }}>✕</button>
                </div>
                <input
                  autoFocus
                  value={buscarAyuda}
                  onChange={e => { setBuscarAyuda(e.target.value); buscarEnBD(e.target.value) }}
                  placeholder="Busca por nombre, organismo o tema..."
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 12, color: C.light, marginTop: 6 }}>Mínimo 3 caracteres. Busca en {'>'}200 ayudas activas.</div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {buscando ? (
                  <div style={{ padding: 24, color: C.muted, fontSize: 13, textAlign: 'center' }}>Buscando...</div>
                ) : resultadosBusqueda.length === 0 && buscarAyuda.length >= 3 ? (
                  <div style={{ padding: 24, color: C.muted, fontSize: 13, textAlign: 'center' }}>Sin resultados para "{buscarAyuda}"</div>
                ) : resultadosBusqueda.map(a => {
                  const yaEsta = (cliente.ayudas_ids || []).includes(a.id)
                  return (
                    <div key={a.id}
                      style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, background: yaEsta ? C.bg : 'transparent' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{a.nombre}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{a.organismo}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          {a.comunidad_autonoma && <span style={{ fontSize: 10, color: C.blue, background: C.blueBg, padding: '2px 6px', borderRadius: 100 }}>{a.comunidad_autonoma}</span>}
                          {a.importe_max > 0 && <span style={{ fontSize: 10, color: C.orange }}>Hasta {a.importe_max.toLocaleString('es-ES')}€</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => !yaEsta && añadirAyuda(a)}
                        disabled={yaEsta}
                        style={{ fontSize: 12, fontWeight: 600, color: yaEsta ? C.light : C.white, background: yaEsta ? C.bg : C.orange, border: `1px solid ${yaEsta ? C.border : C.orange}`, padding: '6px 14px', borderRadius: 6, cursor: yaEsta ? 'default' : 'pointer', flexShrink: 0 }}>
                        {yaEsta ? 'Ya añadida' : '+ Añadir'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {loadingAyudas ? (
          <div style={{ color: C.light, fontSize: 13 }}>Cargando...</div>
        ) : ayudas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Sin ayudas asignadas todavía.</div>
            <button onClick={() => setModalBuscar(true)}
              style={{ fontSize: 13, color: C.orange, background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              + Buscar y añadir primera ayuda
            </button>
          </div>
        ) : ayudas.map((ayuda, idx) => {
          const tramite = ayudasEstado[ayuda.id] || {}
          const estAyuda = tramite.estado || 'pendiente'
          const colorAyuda = ESTADOS_AYUDA_COLOR[estAyuda] || C.yellow
          const [expanded, setExpanded] = [tramite._expanded, (v) => {
            setAyudasEstado(prev => ({ ...prev, [ayuda.id]: { ...prev[ayuda.id], _expanded: v } }))
          }]
          return (
            <div key={ayuda.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, background: C.white, overflow: 'hidden' }}>
              {/* Header ayuda */}
              <div style={{ padding: '12px 16px', background: C.bg, borderBottom: expanded ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, background: C.border, padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>#{idx + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ayuda.nombre}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{ayuda.organismo}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: colorAyuda, background: colorAyuda + '18', padding: '3px 8px', borderRadius: 100 }}>
                      {ESTADOS_AYUDA_LABEL[estAyuda]}
                    </span>
                    <span style={{ color: C.light, fontSize: 12, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>{expanded ? '▲' : '▼'}</span>
                    <button onClick={e => { e.stopPropagation(); quitarAyuda(ayuda.id) }}
                      title="Quitar ayuda"
                      style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
                  </div>
                </div>
              </div>

              {/* Detalle tramitación */}
              {expanded && (
                <div style={{ padding: '16px' }}>
                  {/* Estado */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado del trámite</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <select value={estAyuda}
                        onChange={e => {
                          const check = canChangeEstado(e.target.value, tramite)
                          if (!check.ok) {
                            alert('No se puede cambiar al estado "' + ESTADOS_AYUDA_LABEL[e.target.value] + '".\n' + check.razon + '.\nRellena primero esas fechas.')
                            return
                          }
                          const nuevo = { ...ayudasEstado, [ayuda.id]: { ...tramite, estado: e.target.value } }
                          setAyudasEstado(nuevo)
                          onUpdate(cliente.id, { ayudas_estado: nuevo })
                        }}
                        style={{ width: '100%', fontSize: 13, background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 6, padding: '8px 10px', color: colorAyuda, cursor: 'pointer', fontWeight: 600 }}>
                        {ESTADOS_AYUDA.map(e => {
                          const check = canChangeEstado(e, tramite)
                          return <option key={e} value={e} disabled={!check.ok && e !== estAyuda}>
                            {ESTADOS_AYUDA_LABEL[e]}{!check.ok && e !== estAyuda ? ' ⚠' : ''}
                          </option>
                        })}
                      </select>
                      {/* Indicador de qué se necesita para avanzar */}
                      {(() => {
                        const siguientes = ESTADOS_AYUDA.filter(e => e !== estAyuda && !canChangeEstado(e, tramite).ok)
                        if (siguientes.length === 0) return null
                        const proximoReq = ESTADO_REQS[ESTADOS_AYUDA[Math.min(ESTADOS_AYUDA.indexOf(estAyuda) + 1, ESTADOS_AYUDA.length - 1)]] || []
                        const falta = proximoReq.find(r => !tramite[r])
                        if (!falta) return null
                        const LABELS2 = { fecha_inicio_tramite: 'Inicio del trámite', fecha_presentacion: 'Fecha presentación', fecha_respuesta: 'Fecha respuesta' }
                        return <div style={{ fontSize: 11, color: '#0891B2', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '6px 10px' }}>
                          💡 Para avanzar: rellena "{LABELS2[falta] || falta}"
                        </div>
                      })()}
                    </div>
                  </div>

                  {/* Fechas con validación SAP */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { key: 'fecha_solicitud_cliente', label: 'Solicitud del cliente' },
                      { key: 'fecha_plazo_maximo', label: '⏰ Plazo máximo presentación' },
                      { key: 'fecha_inicio_tramite', label: 'Inicio del trámite' },
                      { key: 'fecha_presentacion', label: 'Fecha presentación', dep: 'fecha_inicio_tramite', depLabel: 'Inicio del trámite' },
                      { key: 'fecha_resolucion', label: 'Resolución / Respuesta admin.', dep: 'fecha_presentacion', depLabel: 'Fecha presentación' },
                    ].map(f => {
                      const disabled = isFechaDisabled(f.key, tramite)
                      const minDate = getMinDate(f.key, tramite)
                      return (
                        <div key={f.key} title={disabled ? `Requiere: ${f.depLabel}` : undefined}>
                          <label style={{ fontSize: 11, color: disabled ? C.light : C.muted, display: 'block', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {f.label}
                            {disabled && <span style={{ fontSize: 10, color: C.light }}>🔒</span>}
                          </label>
                          <input type="date"
                            value={tramite[f.key] || ''}
                            disabled={disabled}
                            min={minDate || undefined}
                            onChange={e => {
                              const val = e.target.value
                              // Validar que la fecha no sea anterior al mínimo
                              if (minDate && val && val < minDate) {
                                const LABELS3 = { fecha_inicio_tramite: 'Inicio del trámite', fecha_presentacion: 'Fecha presentación', fecha_solicitud_cliente: 'Solicitud del cliente', fecha_respuesta: 'Fecha respuesta' }
                                alert('La fecha no puede ser anterior a: ' + (LABELS3[FECHA_MIN_DEP[f.key]] || FECHA_MIN_DEP[f.key]))
                                return
                              }
                              // Avisar si hay fechas hijas que quedarán incoherentes
                              if (!val) {
                                const hijos = getChildrenDirty(f.key, tramite)
                                if (hijos.length > 0) {
                                  const LABELS4 = { fecha_presentacion: 'Fecha presentación', fecha_fin_tramite: 'Fin del trámite', fecha_respuesta: 'Fecha respuesta', fecha_resolucion: 'Fecha resolución' }
                                  const ok = confirm('Al borrar esta fecha también se borrarán: ' + hijos.map(h => LABELS4[h] || h).join(', ') + '.\n¿Continuar?')
                                  if (!ok) return
                                  // Borrar hijos
                                  const nuevaTramite = { ...tramite, [f.key]: '' }
                                  hijos.forEach(h => { nuevaTramite[h] = '' })
                                  const nuevo = { ...ayudasEstado, [ayuda.id]: nuevaTramite }
                                  setAyudasEstado(nuevo)
                                  onUpdate(cliente.id, { ayudas_estado: nuevo })
                                  return
                                }
                              }
                              const nuevo = { ...ayudasEstado, [ayuda.id]: { ...tramite, [f.key]: val } }
                              setAyudasEstado(nuevo)
                              onUpdate(cliente.id, { ayudas_estado: nuevo })
                            }}
                            style={{ width: '100%', fontSize: 12, background: disabled ? '#F9FAFB' : C.bg, border: `1px solid ${disabled ? C.border : C.borderStrong}`, borderRadius: 6, padding: '6px 8px', color: disabled ? C.light : C.text, boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer' }} />
                          {disabled && f.depLabel && (
                            <div style={{ fontSize: 10, color: C.light, marginTop: 2 }}>Requiere: {f.depLabel}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Notas del trámite */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Notas del trámite</label>
                    <textarea value={tramite.notas || ''} rows={3}
                      onChange={e => {
                        const nuevo = { ...ayudasEstado, [ayuda.id]: { ...tramite, notas: e.target.value } }
                        setAyudasEstado(nuevo)
                      }}
                      onBlur={() => onUpdate(cliente.id, { ayudas_estado: ayudasEstado })}
                      placeholder="Documentación entregada, incidencias, observaciones..."
                      style={{ width: '100%', fontSize: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', color: C.text, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>

                  {/* Importe y enlace */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {ayuda.importe_max > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>
                        Hasta {ayuda.importe_max.toLocaleString('es-ES')}€
                      </span>
                    )}
                    {ayuda.url_oficial && (
                      <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>Ver convocatoria oficial →</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Eliminar */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <button onClick={() => onDelete(cliente.id)}
          style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>
          Eliminar cliente
        </button>
      </div>
    </div>
  )
}
