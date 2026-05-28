import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Token inválido' })

  // Solo aplica a planes de gestoría
  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('plan, session_token')
    .eq('id', user.id)
    .single()

  if (!['starter', 'pro'].includes(usuario?.plan)) {
    return res.json({ ok: true, skip: true }) // ciudadanos no tienen restricción
  }

  if (req.method === 'POST') {
    // Nuevo login: generar token y guardarlo
    const newToken = randomUUID()
    await supabaseAdmin
      .from('usuarios')
      .update({ session_token: newToken })
      .eq('id', user.id)
    return res.json({ ok: true, session_token: newToken })
  }

  if (req.method === 'GET') {
    // Verificar token actual
    const clientToken = req.query.token
    if (!clientToken || !usuario?.session_token) {
      return res.json({ valid: true }) // sin token guardado, primera vez
    }
    return res.json({ valid: clientToken === usuario.session_token })
  }

  res.status(405).end()
}
