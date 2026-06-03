import { createClient } from '@supabase/supabase-js'
import { checklistPorTipo } from '../../../lib/expedientes-estados'

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

// fecha de caducidad = hoy + meses (ISO date)
function caducidadDesde(meses) {
  if (!meses) return null
  const d = new Date()
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoría requerido' })

  // Toda operación referencia un expediente del gestor
  const expedienteId = req.method === 'GET' ? req.query.expediente_id : req.body.expediente_id
  if (!expedienteId) return res.status(400).json({ error: 'expediente_id requerido' })
  const { data: exp } = await supabaseAdmin
    .from('expedientes').select('id, ayuda_id').eq('id', expedienteId).eq('gestor_id', gestorId).single()
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' })

  // GET — listar documentos del expediente
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('expediente_documentos').select('*').eq('expediente_id', expedienteId).order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ documentos: data })
  }

  // POST — crear documento, o generar checklist inicial si action='generar'
  if (req.method === 'POST') {
    if (req.body.action === 'generar') {
      // ¿ya hay documentos? no duplicar
      const { count } = await supabaseAdmin
        .from('expediente_documentos').select('id', { count: 'exact', head: true }).eq('expediente_id', expedienteId)
      if (count > 0) return res.status(409).json({ error: 'El expediente ya tiene documentos' })
      // tipo de la ayuda
      const { data: ayuda } = await supabaseAdmin.from('ayudas').select('tipo').eq('id', exp.ayuda_id).single()
      const plantilla = checklistPorTipo(ayuda?.tipo)
      const filas = plantilla.map(d => ({
        expediente_id: expedienteId, gestor_id: gestorId,
        nombre: d.nombre, estado: 'pendiente', bloqueante: d.bloqueante,
        fecha_caducidad: caducidadDesde(d.caduca_meses),
      }))
      const { data, error } = await supabaseAdmin.from('expediente_documentos').insert(filas).select()
      if (error) return res.status(500).json({ error: error.message })
      await supabaseAdmin.from('expediente_actividad').insert({
        expediente_id: expedienteId, gestor_id: gestorId, tipo: 'documento',
        descripcion: `Checklist de documentos generada (${filas.length} documentos)`, usuario: gestorId,
      })
      return res.json({ documentos: data })
    }
    // documento individual (manual)
    const { nombre, bloqueante, fecha_caducidad } = req.body
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
    const { data, error } = await supabaseAdmin.from('expediente_documentos').insert({
      expediente_id: expedienteId, gestor_id: gestorId,
      nombre: nombre.trim(), estado: 'pendiente', bloqueante: !!bloqueante, fecha_caducidad: fecha_caducidad || null,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ documento: data })
  }

  // PUT — actualizar estado/caducidad de un documento
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })
    delete updates.expediente_id
    const { data, error } = await supabaseAdmin.from('expediente_documentos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('gestor_id', gestorId).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ documento: data })
  }

  // DELETE — eliminar documento
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id requerido' })
    await supabaseAdmin.from('expediente_documentos').delete().eq('id', id).eq('gestor_id', gestorId)
    return res.json({ ok: true })
  }

  res.status(405).end()
}
