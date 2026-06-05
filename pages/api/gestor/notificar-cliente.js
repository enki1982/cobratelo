import { createClient } from '@supabase/supabase-js'
import { enviarEmail } from '../../../lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getGestorId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['sb-access-token']
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id || null
}

const eur = (n) => n == null ? '' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoria requerido' })

  const { expediente_id } = req.body
  if (!expediente_id) return res.status(400).json({ error: 'expediente_id requerido' })

  // Cargar expediente con cliente y ayuda, verificando que es del gestor
  const { data: exp } = await supabaseAdmin
    .from('expedientes')
    .select(`id, estado, importe_concedido,
      cliente:gestoria_clientes!expedientes_cliente_id_fkey ( cliente_nombre, cliente_email ),
      ayuda:ayudas!expedientes_ayuda_id_fkey ( nombre )`)
    .eq('id', expediente_id).eq('gestor_id', gestorId).single()
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' })
  if (!['concedida', 'denegada'].includes(exp.estado)) {
    return res.status(400).json({ error: 'Solo se notifica en estado Concedida o Denegada' })
  }
  const email = exp.cliente?.cliente_email
  if (!email) return res.status(400).json({ error: 'El cliente no tiene email' })

  const nombre = exp.cliente?.cliente_nombre || ''
  const ayuda = exp.ayuda?.nombre || 'tu ayuda'
  const concedida = exp.estado === 'concedida'

  const html = concedida ? `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#059669;font-size:19px">Buenas noticias sobre tu solicitud</h2>
      <p style="color:#333;font-size:14px;line-height:1.6">Hola${nombre ? ' ' + nombre : ''},</p>
      <p style="color:#333;font-size:14px;line-height:1.6">Tu solicitud de <strong>${ayuda}</strong> ha sido <strong style="color:#059669">concedida</strong>${exp.importe_concedido ? ', con un importe de <strong>' + eur(exp.importe_concedido) + '</strong>' : ''}.</p>
      <p style="color:#333;font-size:14px;line-height:1.6">Tu gestoría se pondrá en contacto contigo para los siguientes pasos. ¡Enhorabuena!</p>
      <p style="color:#999;font-size:12px;margin-top:20px">Mensaje enviado por tu gestoría a través de Cóbratelo.es</p>
    </div>` : `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#cc5500;font-size:19px">Actualización sobre tu solicitud</h2>
      <p style="color:#333;font-size:14px;line-height:1.6">Hola${nombre ? ' ' + nombre : ''},</p>
      <p style="color:#333;font-size:14px;line-height:1.6">Te informamos de que tu solicitud de <strong>${ayuda}</strong> ha sido <strong>denegada</strong>.</p>
      <p style="color:#333;font-size:14px;line-height:1.6">Tu gestoría revisará el caso y te indicará si existen alternativas o vías de recurso. Quedamos a tu disposición.</p>
      <p style="color:#999;font-size:12px;margin-top:20px">Mensaje enviado por tu gestoría a través de Cóbratelo.es</p>
    </div>`

  const subject = concedida ? `Tu solicitud de ${ayuda} ha sido concedida` : `Actualización sobre tu solicitud de ${ayuda}`
  const r = await enviarEmail({ to: email, subject, html })
  if (!r.ok) return res.status(500).json({ error: 'No se pudo enviar el correo' })

  // Registrar en actividad
  await supabaseAdmin.from('expediente_actividad').insert({
    expediente_id, gestor_id: gestorId, tipo: 'notificacion_cliente',
    descripcion: `Notificación enviada al cliente: resultado ${exp.estado}`, usuario: gestorId,
  })

  return res.json({ ok: true })
}
