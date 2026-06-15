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

// Lista las solicitudes de tramitacion entrantes para el gestor:
// - las que ya estan asignadas a el (sus clientes)
// - las del pool sin asignar (cualquier gestoria puede recogerlas)
export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  const { data: usuario } = await supabaseAdmin
    .from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) {
    return res.status(403).json({ error: 'Plan gestoria requerido' })
  }

  if (req.method === 'POST') {
    // Recoger una solicitud del pool (asignarsela) o cambiar su estado
    const { solicitud_id, accion } = req.body
    if (!solicitud_id) return res.status(400).json({ error: 'solicitud_id requerido' })

    if (accion === 'recoger') {
      const { error } = await supabaseAdmin
        .from('solicitudes_tramitacion')
        .update({ gestor_id: gestorId, estado: 'en_gestion' })
        .eq('id', solicitud_id)
        .is('gestor_id', null)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
    if (accion === 'descartar') {
      const { error } = await supabaseAdmin
        .from('solicitudes_tramitacion')
        .update({ estado: 'descartada' })
        .eq('id', solicitud_id)
        .eq('gestor_id', gestorId)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
    return res.status(400).json({ error: 'accion no valida' })
  }

  // GET: listar solicitudes asignadas a el + pool sin asignar
  const { data: solicitudes } = await supabaseAdmin
    .from('solicitudes_tramitacion')
    .select('*')
    .or(`gestor_id.eq.${gestorId},gestor_id.is.null`)
    .in('estado', ['pendiente', 'en_gestion'])
    .order('created_at', { ascending: false })

  const propias = []
  const pool = []
  for (const s of (solicitudes || [])) {
    if (s.gestor_id === gestorId) propias.push(s)
    else pool.push(s)
  }

  return res.json({ propias, pool, total: (solicitudes || []).length })
}
