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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoria requerido' })

  const { cliente_id, ayuda_id, motivo } = req.body
  if (!cliente_id || !ayuda_id) return res.status(400).json({ error: 'cliente_id y ayuda_id requeridos' })

  // Verificar cliente del gestor
  const { data: cli } = await supabaseAdmin
    .from('gestoria_clientes').select('id').eq('id', cliente_id).eq('gestor_id', gestorId).single()
  if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' })

  const { error } = await supabaseAdmin.from('expediente_descartes').insert({
    gestor_id: gestorId, cliente_id, ayuda_id, motivo: motivo || null,
  })
  if (error && error.code !== '23505') return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
}
