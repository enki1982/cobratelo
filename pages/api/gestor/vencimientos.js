import { createClient } from '@supabase/supabase-js'
import { construirVencimientos } from '../../../lib/vencimientos'

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

  // Cargar expedientes con cliente y ayuda
  const { data: expedientes } = await supabaseAdmin
    .from('expedientes')
    .select(`id, estado, fecha_plazo_maximo, fecha_resolucion,
      cliente:gestoria_clientes!expedientes_cliente_id_fkey ( cliente_nombre, cliente_email ),
      ayuda:ayudas!expedientes_ayuda_id_fkey ( nombre )`)
    .eq('gestor_id', gestorId)

  const ids = (expedientes || []).map(e => e.id)
  let documentos = [], tareas = []
  if (ids.length > 0) {
    const [d, t] = await Promise.all([
      supabaseAdmin.from('expediente_documentos').select('expediente_id, nombre, fecha_caducidad, bloqueante, estado').in('expediente_id', ids),
      supabaseAdmin.from('expediente_tareas').select('expediente_id, titulo, fecha_vencimiento, completada').in('expediente_id', ids),
    ])
    documentos = d.data || []
    tareas = t.data || []
  }

  const vencimientos = construirVencimientos({ expedientes: expedientes || [], documentos, tareas })
  return res.json({ vencimientos })
}
