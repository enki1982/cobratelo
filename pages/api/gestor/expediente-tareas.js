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

  const expedienteId = req.method === 'GET' ? req.query.expediente_id : req.body.expediente_id
  if (!expedienteId) return res.status(400).json({ error: 'expediente_id requerido' })
  const { data: exp } = await supabaseAdmin
    .from('expedientes').select('id').eq('id', expedienteId).eq('gestor_id', gestorId).single()
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('expediente_tareas').select('*').eq('expediente_id', expedienteId).order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tareas: data })
  }

  if (req.method === 'POST') {
    const { titulo, fecha_vencimiento } = req.body
    if (!titulo?.trim()) return res.status(400).json({ error: 'Título requerido' })
    const { data, error } = await supabaseAdmin.from('expediente_tareas').insert({
      expediente_id: expedienteId, gestor_id: gestorId,
      titulo: titulo.trim(), fecha_vencimiento: fecha_vencimiento || null,
      responsable: gestorId, completada: false,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tarea: data })
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })
    delete updates.expediente_id
    const { data, error } = await supabaseAdmin.from('expediente_tareas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('gestor_id', gestorId).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tarea: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id requerido' })
    await supabaseAdmin.from('expediente_tareas').delete().eq('id', id).eq('gestor_id', gestorId)
    return res.json({ ok: true })
  }

  res.status(405).end()
}
