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
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoría requerido' })

  // Verifica que el expediente es del gestor
  const expedienteId = req.method === 'GET' ? req.query.expediente_id : req.body.expediente_id
  if (!expedienteId) return res.status(400).json({ error: 'expediente_id requerido' })
  const { data: exp } = await supabaseAdmin
    .from('expedientes').select('id').eq('id', expedienteId).eq('gestor_id', gestorId).single()
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('expediente_actividad')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ actividad: data })
  }

  if (req.method === 'POST') {
    const { tipo, descripcion } = req.body
    if (!descripcion?.trim()) return res.status(400).json({ error: 'Descripción requerida' })
    const { data, error } = await supabaseAdmin
      .from('expediente_actividad')
      .insert({
        expediente_id: expedienteId,
        gestor_id: gestorId,
        tipo: tipo || 'nota',
        descripcion: descripcion.trim(),
        usuario: gestorId,
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ actividad: data })
  }

  res.status(405).end()
}
