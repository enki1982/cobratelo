// =============================================================
// MOTOR DE VENCIMIENTOS — escanea toda fecha vigilable de un gestor
// y devuelve una lista unificada con urgencia. Lo usan:
//   - el panel in-app (/api/gestor/vencimientos)
//   - las alertas email del cron de los lunes
// Una sola fuente: no se duplica la lógica de fechas.
// =============================================================

const DIA = 86400000

function dias(fechaISO) {
  if (!fechaISO) return null
  return Math.ceil((new Date(fechaISO) - new Date()) / DIA)
}

function urgencia(d) {
  if (d == null) return null
  if (d < 0) return 'vencido'
  if (d <= 7) return 'rojo'
  if (d <= 21) return 'ambar'
  return 'verde'
}

// Recibe los datos ya cargados (el API hace las queries) y construye la lista.
// expedientes: [{id, estado, fecha_plazo_maximo, fecha_resolucion, cliente, ayuda}]
// documentos:  [{expediente_id, nombre, fecha_caducidad, bloqueante, estado}]
// tareas:      [{expediente_id, titulo, fecha_vencimiento, completada}]
export function construirVencimientos({ expedientes = [], documentos = [], tareas = [] }) {
  const items = []
  const expMap = Object.fromEntries(expedientes.map(e => [e.id, e]))
  const refExp = (id) => {
    const e = expMap[id]
    return e ? { expediente_id: id, cliente: e.cliente?.cliente_nombre || e.cliente?.cliente_email || 'Cliente', ayuda: e.ayuda?.nombre || 'Ayuda' } : { expediente_id: id }
  }

  // Estados donde un expediente ya no "corre" por plazo
  const cerrados = ['concedida', 'denegada', 'cerrada']

  // 1. Plazo máximo de convocatoria (mientras el expediente está activo)
  expedientes.forEach(e => {
    if (cerrados.includes(e.estado)) return
    const d = dias(e.fecha_plazo_maximo)
    if (d == null) return
    items.push({ tipo: 'plazo', etiqueta: 'Plazo de convocatoria', fecha: e.fecha_plazo_maximo, dias: d, urgencia: urgencia(d), ...refExp(e.id) })
  })

  // 2. Requerimiento: si el expediente está en requerimiento, su plazo corre (usamos fecha_plazo_maximo como referencia si existe)
  expedientes.filter(e => e.estado === 'requerimiento').forEach(e => {
    const d = dias(e.fecha_plazo_maximo)
    if (d != null) items.push({ tipo: 'requerimiento', etiqueta: 'Requerimiento por subsanar', fecha: e.fecha_plazo_maximo, dias: d, urgencia: urgencia(d), ...refExp(e.id) })
  })

  // 3. Caducidad de documentos (solo de expedientes no cerrados)
  documentos.forEach(doc => {
    const e = expMap[doc.expediente_id]
    if (!e || cerrados.includes(e.estado)) return
    const d = dias(doc.fecha_caducidad)
    if (d == null) return
    items.push({ tipo: 'documento', etiqueta: `Caduca: ${doc.nombre}`, fecha: doc.fecha_caducidad, dias: d, urgencia: urgencia(d), bloqueante: doc.bloqueante, ...refExp(doc.expediente_id) })
  })

  // 4. Vencimiento de tareas no completadas
  tareas.forEach(t => {
    if (t.completada) return
    const e = expMap[t.expediente_id]
    if (!e || cerrados.includes(e.estado)) return
    const d = dias(t.fecha_vencimiento)
    if (d == null) return
    items.push({ tipo: 'tarea', etiqueta: `Tarea: ${t.titulo}`, fecha: t.fecha_vencimiento, dias: d, urgencia: urgencia(d), ...refExp(t.expediente_id) })
  })

  // Orden: lo más urgente primero (vencidos y pocos días arriba)
  items.sort((a, b) => a.dias - b.dias)
  return items
}

// Filtra solo los que requieren atención (vencido / ≤21 días) para el resumen email.
export function vencimientosUrgentes(items) {
  return items.filter(i => i.urgencia === 'vencido' || i.urgencia === 'rojo' || i.urgencia === 'ambar')
}
