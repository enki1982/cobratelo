import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import { ESTADO_LABEL as SHARED_LABEL, canChangeEstado as sharedCanChange, semaforo as sharedSemaforo, camposHito } from '../../lib/expedientes-estados'
import FichaExpediente from '../../components/FichaExpediente'
import ModalHito from '../../components/ModalHito'
import ManualAyuda from '../../components/ManualAyuda'

const C = {
  bg: '#F7F8FA', white: '#FFFFFF', border: '#E5E7EB', borderStrong: '#D1D5DB',
  text: '#111827', muted: '#6B7280', light: '#9CA3AF',
  orange: '#cc5500', orangeLight: '#FFF5F0', orangeBorder: '#FDDCC4',
  green: '#059669', greenBg: '#ECFDF5', blue: '#2563EB', blueBg: '#EFF6FF',
  yellow: '#D97706', yellowBg: '#FFFBEB', red: '#DC2626', redBg: '#FEF2F2',
  purple: '#7C3AED',
}

// Estados del expediente (columnas del Kanban), en orden de flujo
const COLUMNAS = [
  { key: 'nuevo', label: 'Nuevo', color: C.muted },
  { key: 'en_estudio', label: 'En estudio', color: C.blue },
  { key: 'documentacion', label: 'Documentación', color: C.purple },
  { key: 'lista_presentar', label: 'Lista para presentar', color: '#0891B2' },
  { key: 'presentada', label: 'Presentada', color: C.orange },
  { key: 'requerimiento', label: 'Requerimiento', color: C.red, critico: true },
  { key: 'concedida', label: 'Concedida', color: C.green },
  { key: 'denegada', label: 'Denegada', color: C.light },
  { key: 'justificacion', label: 'Justificación', color: '#0891B2' },
  { key: 'cerrada', label: 'Cerrada', color: C.text },
]
const LABEL = Object.fromEntries(COLUMNAS.map(c => [c.key, c.label]))

// Qué fechas exige cada estado (espejo de la validación SAP de gestor.js,
// adaptada a los campos de la tabla expedientes)
const ESTADO_REQS = {
  nuevo: [],
  en_estudio: [],
  documentacion: [],
  lista_presentar: ['fecha_inicio_tramite'],
  presentada: ['fecha_inicio_tramite', 'fecha_presentacion'],
  requerimiento: ['fecha_inicio_tramite', 'fecha_presentacion'],
  concedida: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
  denegada: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
  justificacion: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
  cerrada: ['fecha_inicio_tramite', 'fecha_presentacion', 'fecha_resolucion'],
}
const FECHA_LABEL = {
  fecha_inicio_tramite: 'Inicio del trámite',
  fecha_presentacion: 'Fecha de presentación',
  fecha_resolucion: 'Fecha de resolución',
}

function canChangeEstado(nuevoEstado, exp) {
  const reqs = ESTADO_REQS[nuevoEstado] || []
  const faltan = reqs.filter(r => !exp[r])
  if (faltan.length === 0) return { ok: true }
  return { ok: false, razon: 'Falta rellenar: ' + faltan.map(f => FECHA_LABEL[f] || f).join(', ') }
}

// Semáforo de plazo según fecha_plazo_maximo
function semaforo(exp) {
  if (['concedida', 'denegada', 'cerrada'].includes(exp.estado)) return null
  const plazo = exp.fecha_plazo_maximo
  if (!plazo) return null
  const dias = Math.ceil((new Date(plazo) - new Date()) / 86400000)
  if (dias < 0) return { color: C.red, label: 'Vencido', dias }
  if (dias <= 7) return { color: C.red, label: `${dias}d`, dias }
  if (dias <= 21) return { color: C.yellow, label: `${dias}d`, dias }
  return { color: C.green, label: `${dias}d`, dias }
}

const eur = n => n == null ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function ExpedientesKanban() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [token, setToken] = useState(null)
  const [expedientes, setExpedientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('todos')
  const [soloUrgentes, setSoloUrgentes] = useState(false)
  const [vista, setVista] = useState('kanban')
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [panelVenc, setPanelVenc] = useState(false)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [panelBandeja, setPanelBandeja] = useState(false)
  const [matches, setMatches] = useState(null)
  const [solicitudes, setSolicitudes] = useState(null)
  const [numSolicitudes, setNumSolicitudes] = useState(0)
  const [solicitudesVistas, setSolicitudesVistas] = useState(0)
  const [vencimientos, setVencimientos] = useState(null)
  const [alertaEmails, setAlertaEmails] = useState([])
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [hito, setHito] = useState(null)   // { exp, nuevoEstado } cuando una transición requiere captura
  // Provisional: alta manual de expediente (cliente + ayuda)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [clientesAll, setClientesAll] = useState([])
  const [nuevoCli, setNuevoCli] = useState('')
  const [busqAyuda, setBusqAyuda] = useState('')
  const [ayudasRes, setAyudasRes] = useState([])
  const [ayudaSel, setAyudaSel] = useState(null)
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      const { data } = await supabase.from('usuarios').select('plan').eq('id', session.user.id).single()
      if (!['starter', 'pro'].includes(data?.plan)) { router.push('/precios'); return }
      setPlan(data.plan)
      cargar(session.access_token)
    })
  }, [])

  // Polling del muro de solicitudes: badge + globo cuando entra una nueva
  useEffect(() => {
    if (!token) return
    let activo = true
    const consultar = async () => {
      try {
        const res = await fetch('/api/gestor/solicitudes', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const j = await res.json()
        if (!activo) return
        const total = (j.propias?.length || 0) + (j.pool?.length || 0)
        setNumSolicitudes(prev => {
          // Si hay mas que antes y ya habiamos cargado una vez, avisar
          if (prev !== null && total > prev && prev !== 0) {
            mostrarAviso(`📩 Nueva solicitud de tramitación (${total} pendientes)`)
          } else if (prev === 0 && total > 0) {
            mostrarAviso(`📩 Tienes ${total} solicitud${total > 1 ? 'es' : ''} de tramitación`)
          }
          return total
        })
      } catch {}
    }
    consultar()
    const id = setInterval(consultar, 30000)
    return () => { activo = false; clearInterval(id) }
  }, [token])

  const cargar = async (tok) => {
    try {
      const res = await fetch('/api/gestor/expedientes', { headers: { Authorization: `Bearer ${tok}` } })
      const json = await res.json()
      setExpedientes(json.expedientes || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const mostrarAviso = (msg) => {
    setAviso(msg)
    setTimeout(() => setAviso(null), 3500)
  }

  const abrirBandeja = async () => {
    setPanelBandeja(true); setMatches(null); setSolicitudes(null);
    try {
      const res = await fetch('/api/gestor/matches', { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      setMatches(j.matches || []);
    } catch (e) { setMatches([]); }
    try {
      const rs = await fetch('/api/gestor/solicitudes', { headers: { Authorization: `Bearer ${token}` } });
      const js = await rs.json();
      setSolicitudes([...(js.propias || []), ...(js.pool || [])]);
    } catch (e) { setSolicitudes([]); }
  };
  const recogerSolicitud = async (s) => {
    const res = await fetch('/api/gestor/solicitudes', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitud_id: s.id, accion: 'recoger' }) });
    if (res.ok) { setSolicitudes(ss => ss.filter(x => x.id !== s.id)); setAviso('Solicitud recogida. El cliente está ahora en tu cartera.'); }
  };
  const descartarSolicitud = async (s) => {
    const res = await fetch('/api/gestor/solicitudes', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitud_id: s.id, accion: 'descartar' }) });
    if (res.ok) setSolicitudes(ss => ss.filter(x => x.id !== s.id));
  };
  const aceptarMatch = async (m) => {
    const res = await fetch('/api/gestor/expedientes', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: m.cliente_id, ayuda_id: m.ayuda_id, importe_estimado: m.importe_max, fecha_plazo_maximo: m.fecha_cierre, origen: 'match' }) });
    if (res.ok) { setMatches(ms => ms.filter(x => !(x.cliente_id===m.cliente_id && x.ayuda_id===m.ayuda_id))); cargar(token); }
    else { const j = await res.json(); mostrarAviso(j.error || 'No se pudo aceptar'); }
  };
  const descartarMatch = async (m) => {
    const motivo = window.prompt('Motivo del descarte (opcional):') || '';
    const res = await fetch('/api/gestor/descartar-match', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: m.cliente_id, ayuda_id: m.ayuda_id, motivo }) });
    if (res.ok) setMatches(ms => ms.filter(x => !(x.cliente_id===m.cliente_id && x.ayuda_id===m.ayuda_id)));
  };
  const abrirVencimientos = async () => {
    setPanelVenc(true)
    setVencimientos(null)
    try {
      const res = await fetch('/api/gestor/vencimientos', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setVencimientos(json.vencimientos || [])
    } catch (e) { setVencimientos([]) }
    // cargar destinatarios de alertas
    try {
      const r = await fetch('/api/gestor/alertas-emails', { headers: { Authorization: `Bearer ${token}` } })
      const j = await r.json()
      setAlertaEmails(j.alertas_emails || [])
    } catch (e) {}
  }

  const guardarEmails = async (lista) => {
    setAlertaEmails(lista)
    try {
      const r = await fetch('/api/gestor/alertas-emails', {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertas_emails: lista }),
      })
      const j = await r.json()
      if (!r.ok) mostrarAviso(j.error || 'No se pudo guardar')
      else setAlertaEmails(j.alertas_emails)
    } catch (e) { mostrarAviso('Error al guardar correos') }
  }
  const añadirEmail = () => {
    const e = nuevoEmail.trim().toLowerCase()
    if (!e) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { mostrarAviso('Correo no válido'); return }
    if (alertaEmails.includes(e)) { setNuevoEmail(''); return }
    guardarEmails([...alertaEmails, e]); setNuevoEmail('')
  }
  const quitarEmail = (e) => guardarEmails(alertaEmails.filter(x => x !== e))

  // Provisional: cargar clientes del gestor para el alta manual
  const abrirNuevo = async () => {
    setModalNuevo(true)
    if (clientesAll.length === 0) {
      try {
        const res = await fetch('/api/gestor/clientes', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        setClientesAll(json.clientes || [])
      } catch (e) { console.error(e) }
    }
  }

  // Buscar ayudas por nombre (catálogo público, lectura directa)
  const buscarAyudas = async (q) => {
    setBusqAyuda(q)
    setAyudaSel(null)
    if (q.trim().length < 3) { setAyudasRes([]); return }
    const { data } = await supabase
      .from('ayudas')
      .select('id,nombre,organismo,importe_max,fecha_cierre')
      .ilike('nombre', `%${q}%`)
      .limit(8)
    setAyudasRes(data || [])
  }

  const crearExpediente = async () => {
    if (!nuevoCli || !ayudaSel) return
    setCreando(true)
    try {
      const res = await fetch('/api/gestor/expedientes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: nuevoCli,
          ayuda_id: ayudaSel.id,
          importe_estimado: ayudaSel.importe_max ?? null,
          fecha_plazo_maximo: ayudaSel.fecha_cierre ?? null,
          origen: 'manual',
        }),
      })
      const json = await res.json()
      if (!res.ok) { mostrarAviso(json.error || 'No se pudo crear el expediente'); setCreando(false); return }
      setModalNuevo(false)
      setNuevoCli(''); setBusqAyuda(''); setAyudasRes([]); setAyudaSel(null)
      cargar(token)
    } catch (e) {
      mostrarAviso('Error al crear el expediente')
    } finally { setCreando(false) }
  }

  // Cambio de estado (drag o select). Valida y revierte con aviso si no procede.
  // Guardado real del cambio (estado + posibles campos de hito), optimista con revert.
  const aplicarCambio = async (exp, payload) => {
    const prev = expedientes
    setExpedientes(es => es.map(e => e.id === exp.id ? { ...e, ...payload } : e))
    try {
      const res = await fetch('/api/gestor/expedientes', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exp.id, ...payload }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setExpedientes(prev); mostrarAviso(json.error || 'No se pudo guardar el cambio.'); return false }
    } catch (e) {
      setExpedientes(prev)
      mostrarAviso('No se pudo guardar el cambio. Inténtalo de nuevo.')
      return false
    }
    return true
  }

  // Cambio de estado. Hito (Presentada/Concedida/Denegada) → modal de captura.
  // Resto → validación de candado y avance directo.
  const cambiarEstado = async (exp, nuevoEstado) => {
    if (exp.estado === nuevoEstado) return false
    const def = camposHito(nuevoEstado, exp)
    if (def && def.campos.length > 0) {
      setHito({ exp, nuevoEstado })   // la tarjeta no se mueve hasta confirmar el modal
      return false
    }
    const check = canChangeEstado(nuevoEstado, exp)
    if (!check.ok) {
      mostrarAviso(`No se puede mover a "${LABEL[nuevoEstado]}". ${check.razon}.`)
      return false
    }
    return aplicarCambio(exp, { estado: nuevoEstado })
  }

  const onDrop = (estadoDestino) => {
    setDragOver(null)
    const exp = expedientes.find(e => e.id === dragId)
    setDragId(null)
    if (exp) cambiarEstado(exp, estadoDestino)   // si inválido, no muta y avisa → la tarjeta se queda donde estaba
  }

  const clientes = [...new Map(expedientes.map(e => [e.cliente?.id, e.cliente])).values()].filter(Boolean)

  const filtrados = expedientes.filter(e => {
    if (filtroCliente !== 'todos' && e.cliente?.id !== filtroCliente) return false
    if (soloUrgentes) { const s = semaforo(e); if (!s || s.color !== C.red) return false }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const hay = [e.cliente?.cliente_nombre, e.cliente?.cliente_email, e.cliente?.dni, e.ayuda?.nombre]
        .filter(Boolean).some(v => v.toLowerCase().includes(q))
      if (!hay) return false
    }
    return true
  })

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: C.muted, fontSize: 14 }}>Cargando expedientes…</span>
    </div>
  )

  return (
    <>
      <Head><title>Expedientes — Cóbratelo.es</title></Head>
      <div className="gestor-panel" style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Header con navegación cruzada */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, color: C.orange, textDecoration: 'none', letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: C.text }}>.es</span>
            </a>
            <span style={{ color: C.border }}>|</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.orange, padding: '6px 12px', borderRadius: 8, background: C.orangeLight }}>Expedientes</span>
              <a href="/gestor/clientes" style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>Clientes</a>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenBg, padding: '3px 10px', borderRadius: 100, border: `1px solid ${C.border}` }}>
              {plan === 'pro' ? 'Pro' : 'Básico'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/cuenta" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Mi cuenta</a>
            <button onClick={abrirNuevo} title="Provisional para pruebas"
              style={{ display: 'none', background: C.orange, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, alignItems: 'center', gap: 6 }}>
              ＋ Nuevo expediente <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.5px' }}>provisional</span>
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 24px' }}>

          {/* Toolbar: búsqueda + filtros + vista */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, NIF o ayuda…"
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', color: C.text, fontSize: 13, width: 260, outline: 'none' }} />
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.cliente_nombre || c.cliente_email}</option>)}
            </select>
            <button onClick={() => setSoloUrgentes(v => !v)}
              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: `1px solid ${soloUrgentes ? C.red : C.border}`, background: soloUrgentes ? C.redBg : 'transparent', color: soloUrgentes ? C.red : C.muted, cursor: 'pointer', fontWeight: soloUrgentes ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Solo urgentes
            </button>
            <button onClick={() => { abrirBandeja(); setSolicitudesVistas(numSolicitudes); }}
              style={{ position: 'relative', fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #FDDCC4', background: '#FFF5F0', color: '#cc5500', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, marginRight: 8 }}>
              Bandeja de matches
              {numSolicitudes > 0 && (
                <span style={{ position: 'absolute', top: -7, right: -7, background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{numSolicitudes}</span>
              )}
            </button>
            <button onClick={() => setManualAbierto(true)} title="Ayuda"
              style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, marginRight: 8 }}>
              ? Ayuda
            </button>
            <button onClick={abrirVencimientos}
              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.orangeBorder}`, background: C.orangeLight, color: C.orange, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Vencimientos
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 2, background: C.bg, borderRadius: 8, padding: 3 }}>
              {['kanban', 'lista'].map(v => (
                <button key={v} onClick={() => setVista(v)}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: 'none', background: vista === v ? C.white : 'transparent', color: vista === v ? C.text : C.muted, cursor: 'pointer', fontWeight: vista === v ? 600 : 400, boxShadow: vista === v ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>{v}</button>
              ))}
            </div>
          </div>

          {expedientes.length === 0 ? (
            <div style={{ background: C.white, border: `1px dashed ${C.borderStrong}`, borderRadius: 12, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Aún no hay expedientes</div>
              <div style={{ fontSize: 13, color: C.muted, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                Los expedientes se crean al aceptar un match de la bandeja o manualmente desde un cliente.
                Cada expediente es un cliente con una ayuda concreta en tramitación.
              </div>
            </div>
          ) : vista === 'kanban' ? (
            /* TABLERO KANBAN */
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
              {COLUMNAS.map(col => {
                const items = filtrados.filter(e => e.estado === col.key)
                const isOver = dragOver === col.key
                return (
                  <div key={col.key}
                    onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                    onDragLeave={() => setDragOver(o => o === col.key ? null : o)}
                    onDrop={() => onDrop(col.key)}
                    style={{ minWidth: 260, width: 260, flexShrink: 0, background: isOver ? C.orangeLight : '#F0F1F4', borderRadius: 12, padding: 10, border: col.critico ? `1.5px solid ${C.red}` : `1px solid ${isOver ? C.orangeBorder : 'transparent'}`, transition: 'background 0.12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />{col.label}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.light, background: C.white, padding: '1px 8px', borderRadius: 100 }}>{items.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                      {items.map(exp => {
                        const sem = semaforo(exp)
                        return (
                          <div key={exp.id} draggable
                            onDragStart={() => setDragId(exp.id)}
                            onDragEnd={() => { setDragId(null); setDragOver(null) }}
                            onClick={() => setDetalle(exp)}
                            style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'grab', boxShadow: dragId === exp.id ? '0 8px 20px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)', opacity: dragId === exp.id ? 0.5 : 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{exp.cliente?.cliente_nombre || exp.cliente?.cliente_email || 'Cliente'}</div>
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{exp.ayuda?.nombre || 'Ayuda'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{eur(exp.importe_concedido ?? exp.importe_estimado)}</span>
                              {sem && <span style={{ fontSize: 11, fontWeight: 700, color: sem.color, background: sem.color + '18', padding: '2px 8px', borderRadius: 100 }}>{sem.label}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* VISTA LISTA */
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 130px 140px 110px', padding: '11px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <span>Cliente</span><span>Ayuda</span><span>Importe</span><span>Estado</span><span>Plazo</span>
              </div>
              {filtrados.map((exp, idx) => {
                const sem = semaforo(exp)
                const col = COLUMNAS.find(c => c.key === exp.estado)
                return (
                  <div key={exp.id} onClick={() => setDetalle(exp)}
                    style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 130px 140px 110px', padding: '13px 20px', borderBottom: idx < filtrados.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>{exp.cliente?.cliente_nombre || exp.cliente?.cliente_email}</span>
                    <span style={{ color: C.muted, paddingRight: 12 }}>{exp.ayuda?.nombre}</span>
                    <span style={{ fontWeight: 700, color: C.orange }}>{eur(exp.importe_concedido ?? exp.importe_estimado)}</span>
                    <span><span style={{ fontSize: 11, fontWeight: 600, color: col?.color, background: (col?.color || C.muted) + '18', padding: '3px 10px', borderRadius: 100 }}>{col?.label}</span></span>
                    <span>{sem ? <span style={{ fontSize: 12, fontWeight: 700, color: sem.color }}>{sem.label}</span> : <span style={{ color: C.light }}>—</span>}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Aviso flotante (revert / errores) */}
        {aviso && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.text, color: C.white, fontSize: 13, fontWeight: 500, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 100, maxWidth: 480, textAlign: 'center', lineHeight: 1.4 }}>
            {aviso}
          </div>
        )}

        {/* Modal provisional: alta manual de expediente */}
        {modalNuevo && (
          <div onClick={() => setModalNuevo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 700 }}>Nuevo expediente</h3>
                <span style={{ fontSize: 9, fontWeight: 700, background: C.orangeLight, color: C.orange, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.5px' }}>provisional</span>
              </div>
              <p style={{ margin: '0 0 18px', fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Alta manual para pruebas. En producción los expedientes nacerán de la bandeja de matches.</p>

              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Cliente</label>
              <select value={nuevoCli} onChange={e => setNuevoCli(e.target.value)}
                style={{ width: '100%', fontSize: 13, background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, cursor: 'pointer', marginBottom: 16 }}>
                <option value="">Selecciona un cliente…</option>
                {clientesAll.map(c => <option key={c.id} value={c.id}>{c.cliente_nombre || c.cliente_email}</option>)}
              </select>

              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Ayuda</label>
              <input value={busqAyuda} onChange={e => buscarAyudas(e.target.value)}
                placeholder="Escribe al menos 3 letras del nombre…"
                style={{ width: '100%', fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.text, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              {ayudaSel ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 18 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ayudaSel.nombre}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{ayudaSel.organismo}</div>
                  </div>
                  <button onClick={() => { setAyudaSel(null); setBusqAyuda('') }} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
                </div>
              ) : ayudasRes.length > 0 && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 18, maxHeight: 200, overflowY: 'auto' }}>
                  {ayudasRes.map(a => (
                    <div key={a.id} onClick={() => { setAyudaSel(a); setAyudasRes([]) }}
                      style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{a.nombre}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{a.organismo}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={crearExpediente} disabled={!nuevoCli || !ayudaSel || creando}
                  style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff', background: (!nuevoCli || !ayudaSel || creando) ? C.light : C.orange, border: 'none', padding: '11px', borderRadius: 8, cursor: (!nuevoCli || !ayudaSel || creando) ? 'not-allowed' : 'pointer' }}>
                  {creando ? 'Creando…' : 'Crear expediente'}
                </button>
                <button onClick={() => setModalNuevo(false)}
                  style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, padding: '11px', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal mínimo de detalle (ficha completa en bloque posterior) */}
        {/* Modal de captura de hito (avanzar + registrar fecha en un acto) */}
        {hito && (
          <ModalHito
            expediente={hito.exp}
            nuevoEstado={hito.nuevoEstado}
            onCancel={() => setHito(null)}
            onConfirm={async (payload) => {
              const ok = await aplicarCambio(hito.exp, payload)
              if (ok) { setHito(null); setDetalle(d => d && d.id === hito.exp.id ? { ...d, ...payload } : d) }
              return ok
            }}
          />
        )}

        {/* Ficha de expediente completa (Resumen · Documentos · Tareas · Actividad · Honorarios) */}
        {detalle && (
          <FichaExpediente
            expediente={detalle}
            token={token}
            mostrarAviso={mostrarAviso}
            onClose={() => setDetalle(null)}
            onUpdate={(actualizado) => {
              setExpedientes(es => es.map(e => e.id === actualizado.id ? { ...e, ...actualizado } : e))
              setDetalle(d => d && d.id === actualizado.id ? { ...d, ...actualizado } : d)
            }}
          />
        )}

        {/* Panel transversal de vencimientos */}
        {panelBandeja && (
          <div onClick={() => setPanelBandeja(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 92 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: 480, maxWidth: '100%', height: '100%', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Bandeja de matches</h3>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Ayudas detectadas para tus clientes</div>
                </div>
                <button onClick={() => setPanelBandeja(false)} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ padding: '16px 24px', overflowY: 'auto' }}>
                {/* MURO DE SOLICITUDES por region — el ciudadano pidio activamente que le tramiten */}
                {solicitudes && solicitudes.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📩</span> Muro de solicitudes ({solicitudes.length})
                    </div>
                    {Object.entries(
                      solicitudes.reduce((acc, s) => {
                        const region = [s.provincia, s.ccaa].filter(Boolean).join(' · ') || 'Sin región'
                        ;(acc[region] = acc[region] || []).push(s)
                        return acc
                      }, {})
                    ).map(([region, lista]) => (
                      <div key={region} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 4, borderBottom: `1px solid ${C.border}` }}>
                          <span>📍</span> {region} <span style={{ color: C.muted, fontWeight: 400 }}>({lista.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {lista.map((s) => (
                            <div key={s.id} style={{ border: `1.5px solid ${C.green}`, background: 'rgba(74,222,128,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{s.ciudadano_nombre || s.ciudadano_email || 'Solicitud entrante'}</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{s.ayuda_nombre}</div>
                              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.ayuda_organismo}{s.ayuda_importe ? ' · hasta ' + new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(s.ayuda_importe) : ''}</div>
                              <div style={{ fontSize: 11, color: C.green, marginTop: 6, fontStyle: 'italic' }}>✓ Este cliente ha pedido que le tramiten esta ayuda</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button onClick={() => recogerSolicitud(s)} style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff', background: C.green, border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Atender solicitud</button>
                                <button onClick={() => descartarSolicitud(s)} style={{ fontSize: 12, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>Descartar</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(solicitudes && solicitudes.length > 0) && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Otras ayudas detectadas</div>
                )}
                {matches === null ? (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Buscando matches…</div>
                ) : matches.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '30px 0', lineHeight: 1.6 }}>No hay matches nuevos. Si tus clientes no tienen perfil, rellénalo desde su ficha para que aparezcan ayudas aquí.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {matches.map((m, i) => (
                      <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{m.cliente_nombre}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{m.ayuda_nombre}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.organismo}{m.importe_max ? ' · hasta ' + new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(m.importe_max) : ''}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={() => aceptarMatch(m)} style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff', background: C.green, border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Aceptar</button>
                          <button onClick={() => descartarMatch(m)} style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Descartar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {manualAbierto && <ManualAyuda onClose={() => setManualAbierto(false)} />}
        {panelVenc && (
          <div onClick={() => setPanelVenc(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 92 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: 460, maxWidth: '100%', height: '100%', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Vencimientos</h3>
                <button onClick={() => setPanelVenc(false)} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ padding: '16px 24px', overflowY: 'auto' }}>
                {vencimientos === null ? (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Cargando…</div>
                ) : vencimientos.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '30px 0', lineHeight: 1.5 }}>Nada vence próximamente. Todo bajo control.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {vencimientos.map((v, i) => {
                      const col = v.urgencia === 'vencido' || v.urgencia === 'rojo' ? C.red : v.urgencia === 'ambar' ? C.yellow : C.green
                      return (
                        <div key={i} style={{ border: `1px solid ${C.border}`, borderLeft: `3px solid ${col}`, borderRadius: 9, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.etiqueta}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{v.dias < 0 ? `Hace ${-v.dias}d` : `${v.dias}d`}</span>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{v.cliente} · {v.ayuda}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Destinatarios de las alertas semanales por email */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 24px', background: C.bg }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Alertas por email (lunes)</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                  Cada lunes enviamos este resumen a estos correos. Añade el tuyo y los de tu equipo.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {alertaEmails.length === 0 && <span style={{ fontSize: 12, color: C.light }}>Sin destinatarios: no se enviarán alertas.</span>}
                  {alertaEmails.map(e => (
                    <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.white, border: `1px solid ${C.border}`, borderRadius: 100, padding: '4px 6px 4px 12px', fontSize: 12, color: C.text }}>
                      {e}
                      <button onClick={() => quitarEmail(e)} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && añadirEmail()}
                    placeholder="correo@ejemplo.com"
                    style={{ flex: 1, fontSize: 13, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, outline: 'none' }} />
                  <button onClick={añadirEmail} style={{ background: C.orange, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Añadir</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}
