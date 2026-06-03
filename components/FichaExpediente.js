import { useState, useEffect } from 'react'
import {
  ESTADOS, ESTADO_LABEL, FECHAS, FECHA_LABEL,
  canChangeEstado, isFechaDisabled, getMinDate, validarFecha, getChildrenDirty,
  camposHito, fechaEditableEnFicha,
} from '../lib/expedientes-estados'
import ModalHito from './ModalHito'

const C = {
  bg: '#F7F8FA', white: '#FFFFFF', border: '#E5E7EB', borderStrong: '#D1D5DB',
  text: '#111827', muted: '#6B7280', light: '#9CA3AF',
  orange: '#cc5500', orangeLight: '#FFF5F0', orangeBorder: '#FDDCC4',
  green: '#059669', greenBg: '#ECFDF5', blue: '#2563EB', blueBg: '#EFF6FF',
  yellow: '#D97706', yellowBg: '#FFFBEB', red: '#DC2626', redBg: '#FEF2F2', purple: '#7C3AED',
}

const eur = n => n == null || n === '' ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const HONORARIO_TIPOS = [
  { key: 'fijo', label: 'Importe fijo' },
  { key: 'porcentaje', label: '% sobre lo concedido' },
  { key: 'mixto', label: 'Mixto (fijo + %)' },
]
const HONORARIO_ESTADOS = [
  { key: 'pendiente', label: 'Pendiente', color: C.yellow },
  { key: 'facturado', label: 'Facturado', color: C.blue },
  { key: 'cobrado', label: 'Cobrado', color: C.green },
]

// La "siguiente acción" sugerida según el estado actual
const SIGUIENTE_ACCION = {
  nuevo: 'Revisar requisitos del cliente',
  en_estudio: 'Confirmar que cumple y empezar a recopilar documentación',
  documentacion: 'Completar la checklist de documentos',
  lista_presentar: 'Presentar en plazo y registrar nº de registro',
  presentada: 'Esperar resolución de la Administración',
  requerimiento: 'Subsanar antes de que venza el plazo',
  concedida: 'Notificar al cliente y gestionar justificación si aplica',
  denegada: 'Notificar al cliente',
  justificacion: 'Subir justificación de gasto',
  cerrada: 'Expediente archivado',
}

export default function FichaExpediente({ expediente, token, onClose, onUpdate, mostrarAviso }) {
  const [tab, setTab] = useState('resumen')
  const [exp, setExp] = useState(expediente)
  const [actividad, setActividad] = useState([])
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [hitoEstado, setHitoEstado] = useState(null)   // estado destino pendiente de captura
  const [documentos, setDocumentos] = useState([])
  const [tareas, setTareas] = useState([])
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [nuevaTareaFecha, setNuevaTareaFecha] = useState('')

  useEffect(() => { setExp(expediente) }, [expediente])
  useEffect(() => { if (tab === 'actividad') cargarActividad() }, [tab])
  useEffect(() => { if (tab === 'documentos') cargarDocumentos() }, [tab])
  useEffect(() => { if (tab === 'tareas') cargarTareas() }, [tab])

  // --- Persistencia de cambios al expediente (PUT) ---
  const patch = async (campos) => {
    setGuardando(true)
    const prev = exp
    setExp(e => ({ ...e, ...campos }))
    try {
      const res = await fetch('/api/gestor/expedientes', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exp.id, ...campos }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onUpdate && onUpdate(json.expediente)   // sincroniza con el Kanban
      return true
    } catch (e) {
      setExp(prev)
      mostrarAviso && mostrarAviso(e.message || 'No se pudo guardar')
      return false
    } finally { setGuardando(false) }
  }

  // --- Cambio de estado, con la MISMA lógica que el Kanban ---
  // Hito → modal de captura. No-hito → validación de candado y avance directo.
  const cambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === exp.estado) return
    const def = camposHito(nuevoEstado, exp)
    if (def && def.campos.length > 0) {
      setHitoEstado(nuevoEstado)
      return
    }
    const check = canChangeEstado(nuevoEstado, exp)
    if (!check.ok) {
      mostrarAviso && mostrarAviso(`No se puede pasar a "${ESTADO_LABEL[nuevoEstado]}". ${check.razon}.`)
      return
    }
    await patch({ estado: nuevoEstado })
  }

  // --- Edición de una fecha de la ficha (corrección del dato, no cambia estado) ---
  const cambiarFecha = async (campo, valor) => {
    if (!fechaEditableEnFicha(campo, exp)) {
      mostrarAviso && mostrarAviso(`"${FECHA_LABEL[campo]}" se registra al alcanzar ese hito, no antes.`)
      return
    }
    const v = valor || null
    if (v) {
      const chk = validarFecha(campo, v, exp)
      if (!chk.ok) { mostrarAviso && mostrarAviso(`${FECHA_LABEL[campo]}: ${chk.razon}.`); return }
    }
    if (!v) {
      const dirty = getChildrenDirty(campo, exp)
      if (dirty.length) {
        const ok = window.confirm(`Al borrar "${FECHA_LABEL[campo]}" se vaciarán también: ${dirty.map(d => FECHA_LABEL[d]).join(', ')}. ¿Continuar?`)
        if (!ok) return
        const limpiar = { [campo]: null }
        dirty.forEach(d => { limpiar[d] = null })
        await patch(limpiar)
        return
      }
    }
    await patch({ [campo]: v })
  }

  const cargarActividad = async () => {
    try {
      const res = await fetch(`/api/gestor/expediente-actividad?expediente_id=${exp.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setActividad(json.actividad || [])
    } catch (e) { console.error(e) }
  }

  const añadirNota = async () => {
    if (!nota.trim()) return
    try {
      const res = await fetch('/api/gestor/expediente-actividad', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: exp.id, tipo: 'nota', descripcion: nota.trim() }),
      })
      if (res.ok) { setNota(''); cargarActividad() }
    } catch (e) { console.error(e) }
  }

  // --- Documentos ---
  const cargarDocumentos = async () => {
    try {
      const res = await fetch(`/api/gestor/expediente-documentos?expediente_id=${exp.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setDocumentos(json.documentos || [])
    } catch (e) { console.error(e) }
  }
  const generarChecklist = async () => {
    try {
      const res = await fetch('/api/gestor/expediente-documentos', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: exp.id, action: 'generar' }),
      })
      const json = await res.json()
      if (res.ok) setDocumentos(json.documentos || [])
      else mostrarAviso && mostrarAviso(json.error)
    } catch (e) { console.error(e) }
  }
  const cambiarEstadoDoc = async (doc, estado) => {
    setDocumentos(ds => ds.map(d => d.id === doc.id ? { ...d, estado } : d))
    await fetch('/api/gestor/expediente-documentos', {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, estado }),
    })
  }

  // --- Tareas ---
  const cargarTareas = async () => {
    try {
      const res = await fetch(`/api/gestor/expediente-tareas?expediente_id=${exp.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setTareas(json.tareas || [])
    } catch (e) { console.error(e) }
  }
  const crearTarea = async () => {
    if (!nuevaTarea.trim()) return
    try {
      const res = await fetch('/api/gestor/expediente-tareas', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: exp.id, titulo: nuevaTarea.trim(), fecha_vencimiento: nuevaTareaFecha || null }),
      })
      const json = await res.json()
      if (res.ok) { setNuevaTarea(''); setNuevaTareaFecha(''); cargarTareas() }
    } catch (e) { console.error(e) }
  }
  const toggleTarea = async (t) => {
    setTareas(ts => ts.map(x => x.id === t.id ? { ...x, completada: !x.completada } : x))
    await fetch('/api/gestor/expediente-tareas', {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, completada: !t.completada }),
    })
  }
  const borrarTarea = async (t) => {
    setTareas(ts => ts.filter(x => x.id !== t.id))
    await fetch(`/api/gestor/expediente-tareas?id=${t.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  }

  const TABS = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'documentos', label: 'Documentos' },
    { key: 'tareas', label: 'Tareas' },
    { key: 'actividad', label: 'Actividad' },
    { key: 'honorarios', label: 'Honorarios' },
  ]

  return (
    <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, maxWidth: 580, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Cabecera */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{exp.cliente?.cliente_nombre || exp.cliente?.cliente_email}</div>
              <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{exp.ayuda?.nombre}</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 22, lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>
          {/* Pestañas */}
          <div style={{ display: 'flex', gap: 4, marginTop: 18, borderBottom: `1px solid ${C.border}` }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => !t.disabled && setTab(t.key)} disabled={t.disabled}
                title={t.disabled ? 'Disponible en el siguiente bloque' : ''}
                style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? C.orange : 'transparent'}`, padding: '8px 12px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: t.disabled ? C.light : (tab === t.key ? C.orange : C.muted), cursor: t.disabled ? 'not-allowed' : 'pointer', marginBottom: -1 }}>
                {t.label}{t.disabled ? ' ·' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto' }}>

          {tab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Siguiente acción */}
              <div style={{ background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Siguiente acción</div>
                <div style={{ fontSize: 13, color: C.text }}>{SIGUIENTE_ACCION[exp.estado]}</div>
              </div>

              {/* Datos de la ayuda */}
              <div>
                <Label>Ayuda</Label>
                <InfoRow label="Organismo" value={exp.ayuda?.organismo} />
                {exp.ayuda?.url_oficial && (
                  <div style={{ marginTop: 8 }}>
                    <a href={exp.ayuda.url_oficial} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.orange, fontWeight: 600, textDecoration: 'none' }}>Convocatoria oficial →</a>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div>
                <Label>Estado</Label>
                <select value={exp.estado} onChange={e => cambiarEstado(e.target.value)} disabled={guardando}
                  style={{ width: '100%', fontSize: 13, background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, cursor: 'pointer', fontWeight: 600 }}>
                  {ESTADOS.map(s => {
                    const chk = canChangeEstado(s.key, exp)
                    const dis = !chk.ok && s.key !== exp.estado
                    return <option key={s.key} value={s.key} disabled={dis}>{s.label}{dis ? '  (faltan fechas)' : ''}</option>
                  })}
                </select>
              </div>

              {/* Importes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <Label>Importe estimado</Label>
                  <NumInput value={exp.importe_estimado} onSave={v => patch({ importe_estimado: v })} />
                </div>
                <div>
                  <Label>Importe concedido</Label>
                  <NumInput value={exp.importe_concedido} onSave={v => patch({ importe_concedido: v })} />
                </div>
              </div>

              {/* Fechas — editables solo si el estado alcanzó el hito (mapa B) */}
              <div>
                <Label>Fechas del trámite</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {FECHAS.map(f => {
                    const editable = fechaEditableEnFicha(f.key, exp)
                    const min = getMinDate(f.key, exp)
                    return (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: editable ? C.muted : C.light, flex: 1 }}>{f.label}</span>
                        <input type="date" value={exp[f.key] || ''} disabled={!editable} min={min}
                          onChange={e => cambiarFecha(f.key, e.target.value)}
                          title={editable ? '' : 'Se registra al alcanzar ese hito'}
                          style={{ fontSize: 13, background: editable ? C.white : C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', color: editable ? C.text : C.light, width: 160, cursor: editable ? 'auto' : 'not-allowed' }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.light, marginTop: 8, lineHeight: 1.5 }}>
                  Las fechas de hito se registran al avanzar el estado en el tablero. Aquí puedes corregirlas una vez alcanzado ese punto.
                </div>
              </div>

              {/* Datos del cliente */}
              <div>
                <Label>Cliente</Label>
                <InfoRow label="Email" value={exp.cliente?.cliente_email} />
                <InfoRow label="NIF" value={exp.cliente?.dni} />
              </div>
            </div>
          )}

          {tab === 'actividad' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={nota} onChange={e => setNota(e.target.value)} onKeyDown={e => e.key === 'Enter' && añadirNota()}
                  placeholder="Añadir nota (llamada, email…)"
                  style={{ flex: 1, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, outline: 'none' }} />
                <button onClick={añadirNota} style={{ background: C.orange, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Añadir</button>
              </div>
              {actividad.length === 0 ? (
                <div style={{ fontSize: 13, color: C.light, textAlign: 'center', padding: '24px 0' }}>Sin actividad registrada todavía.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {actividad.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.tipo === 'nota' ? C.blue : (a.tipo === 'cambio_estado' ? C.orange : C.light), marginTop: 4 }} />
                        {i < actividad.length - 1 && <span style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{a.descripcion}</div>
                        <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{new Date(a.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'documentos' && (
            <div>
              {documentos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
                    No hay checklist de documentos. Genérala según el tipo de ayuda y ajústala después.
                  </div>
                  <button onClick={generarChecklist} style={{ background: C.orange, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Generar checklist
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(() => {
                    const total = documentos.length
                    const ok = documentos.filter(d => d.estado === 'validado').length
                    return <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{ok} de {total} validados</div>
                  })()}
                  {documentos.map(d => {
                    const hoy = new Date().toISOString().slice(0, 10)
                    const caducado = d.fecha_caducidad && d.fecha_caducidad < hoy
                    return (
                      <div key={d.id} style={{ border: `1px solid ${d.bloqueante ? C.orangeBorder : C.border}`, borderRadius: 9, padding: '10px 12px', background: caducado ? C.redBg : C.white }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>
                              {d.nombre}{d.bloqueante && <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, marginLeft: 6 }}>BLOQUEANTE</span>}
                            </div>
                            {d.fecha_caducidad && (
                              <div style={{ fontSize: 11, color: caducado ? C.red : C.light, marginTop: 2 }}>
                                {caducado ? 'Caducado el ' : 'Caduca el '}{new Date(d.fecha_caducidad).toLocaleDateString('es-ES')}
                              </div>
                            )}
                          </div>
                          <select value={d.estado} onChange={e => cambiarEstadoDoc(d, e.target.value)}
                            style={{ fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 8px', color: C.text, cursor: 'pointer', flexShrink: 0,
                              background: d.estado === 'validado' ? C.greenBg : (d.estado === 'caducado' ? C.redBg : C.white) }}>
                            <option value="pendiente">Pendiente</option>
                            <option value="recibido">Recibido</option>
                            <option value="validado">Validado</option>
                            <option value="caducado">Caducado</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ fontSize: 11, color: C.light, marginTop: 6, lineHeight: 1.5 }}>
                    Los documentos marcados como bloqueantes deben estar validados (y no caducados) para poder pasar el expediente a "Presentada".
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'tareas' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={nuevaTarea} onChange={e => setNuevaTarea(e.target.value)} onKeyDown={e => e.key === 'Enter' && crearTarea()}
                  placeholder="Nueva tarea…"
                  style={{ flex: 1, minWidth: 140, fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, outline: 'none' }} />
                <input type="date" value={nuevaTareaFecha} onChange={e => setNuevaTareaFecha(e.target.value)}
                  style={{ fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text }} />
                <button onClick={crearTarea} style={{ background: C.orange, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Añadir</button>
              </div>
              {tareas.length === 0 ? (
                <div style={{ fontSize: 13, color: C.light, textAlign: 'center', padding: '20px 0' }}>Sin tareas. Añade la primera arriba.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tareas.map(t => {
                    const hoy = new Date().toISOString().slice(0, 10)
                    const vencida = !t.completada && t.fecha_vencimiento && t.fecha_vencimiento < hoy
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 12px' }}>
                        <input type="checkbox" checked={t.completada} onChange={() => toggleTarea(t)} style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: t.completada ? C.light : C.text, textDecoration: t.completada ? 'line-through' : 'none' }}>{t.titulo}</div>
                          {t.fecha_vencimiento && (
                            <div style={{ fontSize: 11, color: vencida ? C.red : C.light, marginTop: 1 }}>
                              {vencida ? 'Venció el ' : 'Vence el '}{new Date(t.fecha_vencimiento).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                        <button onClick={() => borrarTarea(t)} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'honorarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <Label>Modelo de cobro</Label>
                <select value={exp.honorario_tipo || ''} onChange={e => patch({ honorario_tipo: e.target.value || null })}
                  style={{ width: '100%', fontSize: 13, background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, cursor: 'pointer' }}>
                  <option value="">Sin definir</option>
                  {HONORARIO_TIPOS.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
                </select>
              </div>
              {exp.honorario_tipo && (
                <div>
                  <Label>{exp.honorario_tipo === 'porcentaje' ? 'Porcentaje (%)' : exp.honorario_tipo === 'mixto' ? 'Fijo + % (valor de referencia)' : 'Importe (€)'}</Label>
                  <NumInput value={exp.honorario_valor} onSave={v => patch({ honorario_valor: v })} suffix={exp.honorario_tipo === 'porcentaje' ? '%' : '€'} />
                </div>
              )}
              <div>
                <Label>Estado del cobro</Label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {HONORARIO_ESTADOS.map(h => (
                    <button key={h.key} onClick={() => patch({ honorario_estado: h.key })}
                      style={{ flex: 1, fontSize: 12, fontWeight: 600, padding: '8px', borderRadius: 8, border: `1px solid ${exp.honorario_estado === h.key ? h.color : C.border}`, background: exp.honorario_estado === h.key ? h.color + '15' : 'transparent', color: exp.honorario_estado === h.key ? h.color : C.muted, cursor: 'pointer' }}>
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.light, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                Registro interno de honorarios del expediente. Solo para tu control; no genera cobros.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modal de captura de hito al cambiar estado desde la ficha */}
      {hitoEstado && (
        <ModalHito
          expediente={exp}
          nuevoEstado={hitoEstado}
          onCancel={() => setHitoEstado(null)}
          onConfirm={async (payload) => {
            const ok = await patch(payload)
            if (ok) setHitoEstado(null)
            return ok
          }}
        />
      )}
    </>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{children}</div>
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, padding: '3px 0' }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}
// Input numérico que guarda al perder foco
function NumInput({ value, onSave, suffix }) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => { setV(value ?? '') }, [value])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="number" value={v} onChange={e => setV(e.target.value)}
        onBlur={() => { const n = v === '' ? null : Number(v); if (n !== value) onSave(n) }}
        style={{ width: '100%', fontSize: 13, background: C.white, border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px', color: C.text, outline: 'none' }} />
      {suffix && <span style={{ fontSize: 13, color: C.muted }}>{suffix}</span>}
    </div>
  )
}
