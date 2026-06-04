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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoría requerido' })

  const { cliente_id } = req.body  // id de gestoria_clientes
  if (!cliente_id) return res.status(400).json({ error: 'cliente_id requerido' })

  // Verificar que el cliente es del gestor
  const { data: cli } = await supabaseAdmin
    .from('gestoria_clientes').select('id, cliente_email, cliente_nombre, cliente_id')
    .eq('id', cliente_id).eq('gestor_id', gestorId).single()
  if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' })

  // Asegurar que existe la cuenta de usuario
  if (!cli.cliente_id) {
    const { data: created } = await supabaseAdmin.auth.admin.createUser({
      email: cli.cliente_email, email_confirm: true,
      user_metadata: { nombre: cli.cliente_nombre || '', alta_por_gestoria: gestorId },
    })
    if (created?.user) {
      await supabaseAdmin.from('usuarios').upsert({ id: created.user.id, email: cli.cliente_email, plan: 'free' }, { onConflict: 'id' })
      await supabaseAdmin.from('gestoria_clientes').update({ cliente_id: created.user.id }).eq('id', cliente_id)
    }
  }

  const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: cli.cliente_email })
  if (error) return res.status(500).json({ error: error.message })
  const action = link?.properties?.action_link
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#cc5500;font-size:18px">Tu gestoría te ha dado acceso a Cóbratelo.es</h2>
      <p style="color:#333;font-size:14px;line-height:1.6">Hola${cli.cliente_nombre ? ' ' + cli.cliente_nombre : ''}, tu gestoría gestiona tus ayudas en Cóbratelo.es. Accede a tu cuenta:</p>
      <p style="margin:24px 0"><a href="${action}" style="background:#cc5500;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Acceder a mi cuenta</a></p>
      <p style="color:#999;font-size:12px">Si no reconoces a tu gestoría, ignora este correo.</p>
    </div>`
  const r = await enviarEmail({ to: cli.cliente_email, subject: 'Tu gestoría te ha dado acceso a Cóbratelo.es', html })
  if (!r.ok) return res.status(500).json({ error: 'No se pudo enviar el correo' })

  await supabaseAdmin.from('gestoria_clientes').update({ invitado: true, invitado_fecha: new Date().toISOString() }).eq('id', cliente_id)
  return res.json({ ok: true })
}
