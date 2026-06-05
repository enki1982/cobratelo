import { useState } from 'react'

const C = {
  bg: '#F7F8FA', white: '#FFFFFF', border: '#E5E7EB', borderStrong: '#D1D5DB',
  text: '#111827', muted: '#6B7280', light: '#9CA3AF',
  orange: '#cc5500', orangeLight: '#FFF5F0', orangeBorder: '#FDDCC4',
}

const SECCIONES = [
  {
    id: 'expediente',
    titulo: '¿Qué es un expediente y cómo funciona el tablero?',
    cuerpo: [
      'Un expediente es un cliente con una ayuda concreta en tramitación. Todo el trabajo gira en torno a los expedientes, no a los clientes ni a las ayudas por separado.',
      'El tablero (Kanban) es tu pantalla principal. Cada columna es un estado del trámite y cada tarjeta es un expediente. Arrastra una tarjeta de una columna a otra para cambiar su estado.',
      'Cada tarjeta muestra lo mínimo: cliente, ayuda, importe y un semáforo de plazo (verde, ámbar o rojo según lo cerca que esté el vencimiento). Arriba tienes la búsqueda global y los filtros por cliente y urgencia. Puedes alternar entre vista Kanban y vista lista.',
    ],
  },
  {
    id: 'bandeja',
    titulo: 'La bandeja de matches (aceptar o descartar)',
    cuerpo: [
      'La bandeja reúne las ayudas que Cóbratelo detecta para tus clientes, según el perfil de cada uno. No son expedientes todavía: son propuestas.',
      'Para cada propuesta tienes dos botones. Aceptar la convierte en un expediente activo, que aparece en la columna Nuevo del tablero. Descartar la retira (puedes indicar un motivo) y no volverá a proponerse.',
      'Si un cliente no genera matches, normalmente es porque no tiene perfil. Rellénalo desde su ficha (botón Rellenar perfil) para que el sistema pueda cruzar su situación con las ayudas.',
    ],
  },
  {
    id: 'estados',
    titulo: 'Los estados y por qué a veces no se puede mover una tarjeta',
    cuerpo: [
      'El flujo de estados va de Nuevo a Cerrada, pasando por En estudio, Documentación, Lista para presentar, Presentada, Requerimiento, Concedida o Denegada y Justificación.',
      'Algunos estados exigen datos antes de poder alcanzarse. Por ejemplo, no puedes pasar un expediente a Presentada sin haber registrado la fecha de presentación. Si intentas un movimiento que aún no procede, la tarjeta vuelve a su sitio y te avisa de qué falta.',
      'Cuando un movimiento corresponde a un hito (Presentada, Concedida o Denegada), al soltarlo se abre una ventana que te pide los datos de ese hito (fecha, número de registro, importe concedido). Si la rellenas, el expediente avanza y los datos quedan guardados a la vez. Si cancelas, no se mueve.',
    ],
  },
  {
    id: 'documentos',
    titulo: 'Documentos: checklist, bloqueos y caducidades',
    cuerpo: [
      'Dentro de cada expediente, la pestaña Documentos te da una checklist generada según el tipo de ayuda. Puedes generarla con un clic y ajustarla después.',
      'Cada documento tiene un estado: pendiente, recibido, validado o caducado. Marca cada uno a medida que lo consigues.',
      'Algunos documentos son bloqueantes (por ejemplo, los certificados de estar al corriente con AEAT y Seguridad Social). Mientras un documento bloqueante no esté validado, o si está caducado, el expediente no podrá pasar a Presentada. Los documentos con caducidad se vigilan automáticamente y aparecen en el panel de vencimientos antes de que venzan.',
    ],
  },
  {
    id: 'tareas',
    titulo: 'Tareas',
    cuerpo: [
      'La pestaña Tareas de cada expediente te permite anotar acciones con su fecha de vencimiento y marcarlas como completadas.',
      'Las tareas con vencimiento alimentan el panel de vencimientos, igual que los plazos y las caducidades, para que nada se te pase.',
    ],
  },
  {
    id: 'plazos',
    titulo: 'Panel de vencimientos y alertas por email',
    cuerpo: [
      'El botón Vencimientos abre un panel transversal que reúne todo lo que vence pronto en todos tus expedientes: plazos de convocatoria, requerimientos, caducidades de documentos y tareas. Cada uno con su semáforo según los días que falten.',
      'Además, cada lunes se envía un correo-resumen con los vencimientos de la semana a los destinatarios que configures. Añade tu correo y el de tu equipo en el mismo panel de Vencimientos, en el apartado Alertas por email. El correo es un recordatorio: el detalle completo siempre está en el panel.',
    ],
  },
  {
    id: 'cliente',
    titulo: 'Dar de alta clientes y darles acceso',
    cuerpo: [
      'Desde Clientes puedes añadir un cliente con su email. Al darlo de alta se crea su ficha y, si quieres, su acceso a Cóbratelo.',
      'Para dar de alta debes declarar que cuentas con el consentimiento del cliente para tratar sus datos. Es obligatorio y queda registrado.',
      'Puedes decidir si avisar al cliente en ese momento (se le envía un correo con un enlace de acceso) o hacer el alta en silencio y trabajar sus expedientes sin molestarle. Más adelante, el botón Invitar al cliente de su ficha le envía el acceso cuando lo decidas.',
      'Rellena el perfil del cliente desde su ficha para que aparezcan matches de ayudas en la bandeja.',
    ],
  },
  {
    id: 'notificacion',
    titulo: 'Avisar al cliente del resultado',
    cuerpo: [
      'Cuando un expediente llega a Concedida o Denegada, en su ficha aparece el botón Notificar al cliente.',
      'Al pulsarlo se envía un correo al cliente con el resultado, rellenando su nombre, la ayuda y el importe concedido automáticamente. Tú decides cuándo enviarlo; no sale solo. El envío queda registrado en la pestaña Actividad del expediente.',
    ],
  },
  {
    id: 'honorarios',
    titulo: 'Honorarios',
    cuerpo: [
      'La pestaña Honorarios de cada expediente es un registro interno para tu control: el modelo de cobro (fijo, porcentaje sobre lo concedido, o mixto), el importe y el estado del cobro (pendiente o cobrado).',
      'Es solo informativo: no genera cobros ni facturas, te sirve para llevar la cuenta de lo que cada expediente supone.',
    ],
  },
  {
    id: 'actividad',
    titulo: 'La pestaña Actividad',
    cuerpo: [
      'Cada expediente tiene un registro de Actividad que se va llenando solo: cada cambio de estado, cada notificación enviada, etc., queda anotado con su fecha.',
      'Además puedes añadir notas manuales (una llamada con el cliente, un email enviado). Es la memoria del expediente.',
    ],
  },
]

export default function ManualAyuda({ onClose }) {
  const [q, setQ] = useState('')
  const [abierta, setAbierta] = useState(null)

  const filtradas = SECCIONES.filter(s => {
    if (!q.trim()) return true
    const t = q.toLowerCase()
    return s.titulo.toLowerCase().includes(t) || s.cuerpo.some(p => p.toLowerCase().includes(t))
  })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 95 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: 520, maxWidth: '100%', height: '100%', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Ayuda</h3>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Cómo funciona la herramienta</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 22 }}>✕</button>
        </div>
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}` }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en la ayuda…"
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.text, outline: 'none' }} />
        </div>
        <div style={{ padding: '12px 24px 24px', overflowY: 'auto' }}>
          {filtradas.length === 0 ? (
            <div style={{ fontSize: 13, color: C.light, textAlign: 'center', padding: '24px 0' }}>Nada coincide con "{q}".</div>
          ) : filtradas.map(s => {
            const open = abierta === s.id || q.trim().length > 0
            return (
              <div key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <button onClick={() => setAbierta(abierta === s.id ? null : s.id)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0', fontSize: 14, fontWeight: 600, color: C.text, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{s.titulo}</span>
                  <span style={{ color: C.light, flexShrink: 0 }}>{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div style={{ paddingBottom: 16 }}>
                    {s.cuerpo.map((p, i) => (
                      <p key={i} style={{ margin: '0 0 10px', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
