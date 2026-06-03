// =============================================================
// FUENTE ÚNICA DE VERDAD — estados de expediente y validación SAP
// Importado por el Kanban (gestor/expedientes.js) y la ficha (componente).
// Si una regla cambia, cambia aquí y ambos hablan el mismo idioma.
// =============================================================

// Estados del expediente en orden de flujo
export const ESTADOS = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'en_estudio', label: 'En estudio' },
  { key: 'documentacion', label: 'Documentación' },
  { key: 'lista_presentar', label: 'Lista para presentar' },
  { key: 'presentada', label: 'Presentada' },
  { key: 'requerimiento', label: 'Requerimiento' },
  { key: 'concedida', label: 'Concedida' },
  { key: 'denegada', label: 'Denegada' },
  { key: 'justificacion', label: 'Justificación' },
  { key: 'cerrada', label: 'Cerrada' },
]
export const ESTADO_LABEL = Object.fromEntries(ESTADOS.map(e => [e.key, e.label]))
export const ESTADO_KEYS = ESTADOS.map(e => e.key)

// Las cinco fechas del trámite, con su etiqueta legible
export const FECHAS = [
  { key: 'fecha_solicitud_cliente', label: 'Solicitud del cliente' },
  { key: 'fecha_plazo_maximo', label: 'Plazo máximo de presentación' },
  { key: 'fecha_inicio_tramite', label: 'Inicio del trámite' },
  { key: 'fecha_presentacion', label: 'Fecha de presentación' },
  { key: 'fecha_resolucion', label: 'Fecha de resolución' },
]
export const FECHA_LABEL = Object.fromEntries(FECHAS.map(f => [f.key, f.label]))

// Dependencia de habilitación: una fecha no se puede rellenar hasta que su
// fecha "padre" exista (el campo aparece deshabilitado en la ficha).
export const FECHA_DEPS = {
  fecha_solicitud_cliente: null,   // siempre disponible
  fecha_plazo_maximo: null,        // siempre disponible
  fecha_inicio_tramite: null,      // siempre disponible
  fecha_presentacion: 'fecha_inicio_tramite',
  fecha_resolucion: 'fecha_presentacion',
}

// Mínimo cronológico: una fecha no puede ser anterior a su fecha de referencia.
export const FECHA_MIN_DEP = {
  fecha_inicio_tramite: 'fecha_solicitud_cliente',
  fecha_presentacion: 'fecha_inicio_tramite',
  fecha_resolucion: 'fecha_presentacion',
}

// Fechas que cada estado EXIGE para poder alcanzarse.
export const ESTADO_REQS = {
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

// Campos hijos que se invalidan si se borra/cambia un campo (para avisar).
export const FECHA_CHILDREN = {
  fecha_solicitud_cliente: ['fecha_inicio_tramite'],
  fecha_plazo_maximo: [],
  fecha_inicio_tramite: ['fecha_presentacion'],
  fecha_presentacion: ['fecha_resolucion'],
  fecha_resolucion: [],
}

// =============================================================
// HITOS DE TRANSICIÓN — estados cuyo avance captura fecha(s) + datos
// en un único acto (avanzar y registrar el hito son lo mismo).
// El resto de estados se mueven directamente, sin modal.
// Cada campo: { key, label, tipo: 'date'|'number'|'text', obligatorio, min? }
// `min` referencia otra fecha del expediente para validar orden cronológico.
// =============================================================
export const HITOS = {
  presentada: {
    titulo: '¿Cuándo se presentó?',
    campos: [
      // red de seguridad: si no hay inicio de trámite aún, se pide aquí
      { key: 'fecha_inicio_tramite', label: 'Inicio del trámite', tipo: 'date', obligatorio: true, min: 'fecha_solicitud_cliente', soloSiFalta: true },
      { key: 'fecha_presentacion', label: 'Fecha de presentación', tipo: 'date', obligatorio: true, min: 'fecha_inicio_tramite' },
      { key: 'num_registro', label: 'Nº de registro', tipo: 'text', obligatorio: false },
    ],
  },
  concedida: {
    titulo: 'Resolución: concedida',
    campos: [
      { key: 'fecha_resolucion', label: 'Fecha de resolución', tipo: 'date', obligatorio: true, min: 'fecha_presentacion' },
      { key: 'importe_concedido', label: 'Importe concedido (€)', tipo: 'number', obligatorio: true },
    ],
  },
  denegada: {
    titulo: 'Resolución: denegada',
    campos: [
      { key: 'fecha_resolucion', label: 'Fecha de resolución', tipo: 'date', obligatorio: true, min: 'fecha_presentacion' },
    ],
  },
}

// Devuelve los campos del hito que REALMENTE hay que pedir para este expediente
// (omite los `soloSiFalta` que ya tienen valor). Si no hay nada que pedir y el
// estado no es hito, devuelve null → transición directa.
export function camposHito(nuevoEstado, exp) {
  const hito = HITOS[nuevoEstado]
  if (!hito) return null
  const campos = hito.campos.filter(c => !(c.soloSiFalta && exp[c.key]))
  return { titulo: hito.titulo, campos }
}

// Mapa estado→hito mínimo: hasta qué estado debe haber llegado el expediente
// para que una fecha de hito sea editable en la ficha (corrección, no avance).
// El orden es el de ESTADOS.
export const FECHA_EDITABLE_DESDE = {
  fecha_inicio_tramite: 'documentacion',
  fecha_presentacion: 'presentada',
  fecha_resolucion: 'concedida',   // concedida o posterior; denegada se trata aparte
}

// ¿El expediente ha alcanzado (o superado) el estado `objetivo`?
export function estadoAlcanzado(estadoActual, objetivo) {
  return ESTADO_KEYS.indexOf(estadoActual) >= ESTADO_KEYS.indexOf(objetivo)
}

// ¿Es editable en la ficha esta fecha, dado el estado actual? (mapa B + coherencia)
// fecha_solicitud_cliente y fecha_plazo_maximo: siempre. Hitos: solo si el estado
// ya alcanzó el punto correspondiente (así nunca hay fecha por delante del estado).
export function fechaEditableEnFicha(campo, exp) {
  if (campo === 'fecha_solicitud_cliente' || campo === 'fecha_plazo_maximo') return true
  // fecha_resolucion editable tanto en concedida como en denegada
  if (campo === 'fecha_resolucion') return estadoAlcanzado(exp.estado, 'concedida') || exp.estado === 'denegada'
  const desde = FECHA_EDITABLE_DESDE[campo]
  if (!desde) return false
  return estadoAlcanzado(exp.estado, desde)
}

// ¿Se puede pasar a este estado con las fechas actuales del expediente?
export function canChangeEstado(nuevoEstado, exp) {
  const reqs = ESTADO_REQS[nuevoEstado] || []
  const faltan = reqs.filter(r => !exp[r])
  if (faltan.length === 0) return { ok: true }
  return { ok: false, razon: 'Falta rellenar: ' + faltan.map(f => FECHA_LABEL[f] || f).join(', ') }
}

// ¿Está deshabilitado el campo de fecha porque falta su padre?
export function isFechaDisabled(campo, exp) {
  const dep = FECHA_DEPS[campo]
  if (!dep) return false
  return !exp[dep]
}

// Fecha mínima permitida para un campo (su referencia cronológica), formato YYYY-MM-DD.
export function getMinDate(campo, exp) {
  const minDep = FECHA_MIN_DEP[campo]
  if (!minDep) return undefined
  return exp[minDep] || undefined
}

// Validar que una fecha no sea anterior a su mínimo. Devuelve {ok} o {ok:false, razon}.
export function validarFecha(campo, valor, exp) {
  if (!valor) return { ok: true }
  const minDep = FECHA_MIN_DEP[campo]
  if (minDep && exp[minDep] && valor < exp[minDep]) {
    return { ok: false, razon: `No puede ser anterior a "${FECHA_LABEL[minDep]}" (${exp[minDep]})` }
  }
  return { ok: true }
}

// Campos que quedarían "huérfanos" si se borra este campo (recursivo).
export function getChildrenDirty(campo, exp) {
  const hijos = FECHA_CHILDREN[campo] || []
  const dirty = hijos.filter(h => exp[h])
  dirty.forEach(h => {
    getChildrenDirty(h, exp).forEach(hh => { if (!dirty.includes(hh)) dirty.push(hh) })
  })
  return dirty
}

// Semáforo de plazo según fecha_plazo_maximo. Devuelve null si no aplica.
export function semaforo(exp, colores) {
  const C = colores || { red: '#DC2626', yellow: '#D97706', green: '#059669' }
  if (['concedida', 'denegada', 'cerrada'].includes(exp.estado)) return null
  const plazo = exp.fecha_plazo_maximo
  if (!plazo) return null
  const dias = Math.ceil((new Date(plazo) - new Date()) / 86400000)
  if (dias < 0) return { color: C.red, label: 'Vencido', dias }
  if (dias <= 7) return { color: C.red, label: `${dias}d`, dias }
  if (dias <= 21) return { color: C.yellow, label: `${dias}d`, dias }
  return { color: C.green, label: `${dias}d`, dias }
}

// =============================================================
// CHECKLIST DE DOCUMENTOS por tipo de ayuda (ayuda.tipo real en BD:
// subvencion | prestacion | deduccion | bonificacion | prestamo | servicio).
// Se genera al crear el expediente; el gestor puede añadir/quitar después.
// caduca_meses: si tiene valor, el documento caduca y se vigila (motor de plazos).
// bloqueante: si true, su ausencia/caducidad impide pasar a "Presentada".
// =============================================================
const DOC_BASE = [
  { nombre: 'DNI / NIE del solicitante', bloqueante: false },
  { nombre: 'Certificado de estar al corriente con la AEAT', bloqueante: true, caduca_meses: 6 },
  { nombre: 'Certificado de estar al corriente con la Seguridad Social', bloqueante: true, caduca_meses: 6 },
  { nombre: 'Certificado de titularidad bancaria', bloqueante: false },
  { nombre: 'Formulario de solicitud firmado', bloqueante: false },
]
const DOC_POR_TIPO = {
  subvencion: [
    { nombre: 'Memoria o proyecto de la actuación', bloqueante: false },
    { nombre: 'Presupuesto o facturas proforma', bloqueante: false },
    { nombre: 'Justificación de gasto con facturas (tras concesión)', bloqueante: false },
  ],
  prestacion: [
    { nombre: 'Documento acreditativo de la situación (desempleo, baja, nacimiento…)', bloqueante: false },
    { nombre: 'Informe de vida laboral', bloqueante: false },
  ],
  deduccion: [
    { nombre: 'Última declaración de IRPF', bloqueante: false },
    { nombre: 'Justificantes del gasto deducible', bloqueante: false },
  ],
  bonificacion: [
    { nombre: 'Alta en RETA / informe de vida laboral', bloqueante: false },
    { nombre: 'Modelo 036 / 037 (alta censal)', bloqueante: false },
  ],
  prestamo: [
    { nombre: 'Plan de viabilidad / memoria económica', bloqueante: false },
    { nombre: 'Avales o garantías', bloqueante: false },
    { nombre: 'Cuentas anuales', bloqueante: false },
  ],
  servicio: [
    { nombre: 'Formulario específico del servicio', bloqueante: false },
  ],
}

// Devuelve la checklist inicial para un tipo de ayuda dado.
export function checklistPorTipo(tipo) {
  const extra = DOC_POR_TIPO[tipo] || []
  return [...DOC_BASE, ...extra]
}

// ¿Hay documentos bloqueantes sin validar o caducados? Impiden presentar.
// `documentos` es el array de expediente_documentos del expediente.
// Devuelve { ok } o { ok:false, razon }.
export function puedePresentar(documentos) {
  if (!Array.isArray(documentos) || documentos.length === 0) return { ok: true } // sin checklist, no bloquea
  const hoy = new Date().toISOString().slice(0, 10)
  const problemas = documentos.filter(d => d.bloqueante && (
    d.estado !== 'validado' || (d.fecha_caducidad && d.fecha_caducidad < hoy)
  ))
  if (problemas.length === 0) return { ok: true }
  const nombres = problemas.map(p => p.nombre).join(', ')
  return { ok: false, razon: `Documentos bloqueantes sin validar o caducados: ${nombres}` }
}
