import { createClient } from '@supabase/supabase-js'

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan, alertas_emails').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoría requerido' })

  if (req.method === 'GET') {
    return res.json({ alertas_emails: usuario.alertas_emails || [] })
  }

  if (req.method === 'PUT') {
    const { alertas_emails } = req.body
    if (!Array.isArray(alertas_emails)) return res.status(400).json({ error: 'Formato inválido' })
    // Limpiar y validar
    const limpios = [...new Set(alertas_emails.map(e => String(e).trim().toLowerCase()).filter(Boolean))]
    const invalidos = limpios.filter(e => !EMAIL_RE.test(e))
    if (invalidos.length > 0) return res.status(400).json({ error: 'Correos no válidos: ' + invalidos.join(', ') })
    if (limpios.length > 10) return res.status(400).json({ error: 'Máximo 10 correos' })

    const { error } = await supabaseAdmin.from('usuarios').update({ alertas_emails: limpios }).eq('id', gestorId)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ alertas_emails: limpios })
  }

  res.status(405).end()
}
