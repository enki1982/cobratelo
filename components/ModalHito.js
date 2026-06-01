import { useState } from 'react'
import { camposHito, validarFecha, ESTADO_LABEL, FECHA_LABEL } from '../lib/expedientes-estados'

const C = {
  bg: '#F7F8FA', white: '#FFFFFF', border: '#E5E7EB', borderStrong: '#D1D5DB',
  text: '#111827', muted: '#6B7280', light: '#9CA3AF',
  orange: '#cc5500', orangeLight: '#FFF5F0', orangeBorder: '#FDDCC4', red: '#DC2626',
}

// Modal que captura los datos de un hito al avanzar de estado.
// onConfirm(camposRellenados) -> el padre graba estado + campos juntos.
// onCancel() -> revierte (no cambia estado).
export default function ModalHito({ expediente, nuevoEstado, onConfirm, onCancel }) {
  const def = camposHito(nuevoEstado, expediente)
  const [valores, setValores] = useState({})
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  if (!def) return null

  const set = (k, v) => { setValores(p => ({ ...p, [k]: v })); setError(null) }

  // valor efectivo de una fecha de referencia (lo ya guardado o lo que se acaba de teclear)
  const refValor = (campo) => valores[campo] ?? expediente[campo]

  const confirmar = async () => {
    // Validar obligatorios
    for (const c of def.campos) {
      const v = valores[c.key]
      if (c.obligatorio && (v == null || v === '')) {
        setError(`${c.label} es obligatorio.`); return
      }
      // Validar orden cronológico contra su min (mezclando lo tecleado en este mismo modal)
      if (c.tipo === 'date' && v && c.min) {
        const minVal = refValor(c.min)
        if (minVal && v < minVal) {
          setError(`${c.label}: no puede ser anterior a "${FECHA_LABEL[c.min] || c.min}" (${minVal}).`); return
        }
      }
    }
    setGuardando(true)
    // Construir payload: estado + solo los campos con valor
    const payload = { estado: nuevoEstado }
    def.campos.forEach(c => {
      const v = valores[c.key]
      if (v != null && v !== '') payload[c.key] = c.tipo === 'number' ? Number(v) : v
    })
    const ok = await onConfirm(payload)
    if (!ok) setGuardando(false)   // si falla, el padre ya avisa; reabrimos el botón
  }

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, padding: 26, maxWidth: 420, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Pasar a {ESTADO_LABEL[nuevoEstado]}</div>
        <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: C.text }}>{def.titulo}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {def.campos.map(c => (
            <div key={c.key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>
                {c.label}{c.obligatorio && <span style={{ color: C.red }}> *</span>}
              </label>
              <input
                type={c.tipo === 'number' ? 'number' : c.tipo === 'date' ? 'date' : 'text'}
                value={valores[c.key] ?? ''}
                min={c.tipo === 'date' && c.min ? refValor(c.min) : undefined}
                onChange={e => set(c.key, e.target.value)}
                placeholder={c.tipo === 'text' ? 'Opcional' : ''}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, background: C.white, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, outline: 'none' }}
              />
            </div>
          ))}
        </div>

        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={confirmar} disabled={guardando}
            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff', background: guardando ? C.light : C.orange, border: 'none', padding: '11px', borderRadius: 8, cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando…' : 'Confirmar y avanzar'}
          </button>
          <button onClick={onCancel} disabled={guardando}
            style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, padding: '11px', borderRadius: 8, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
