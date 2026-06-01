import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getGestorId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.['sb-access-token']
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id || null
}

// Estados válidos del expediente y transiciones permitidas (validación servidor,
// espejo de la del front). El front además aplica la validación de fechas SAP.
const ESTADOS = ['nuevo', 'en_estudio', 'documentacion', 'lista_presentar', 'presentada', 'requerimiento', 'concedida', 'denegada', 'justificacion', 'cerrada']

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('plan')
    .eq('id', gestorId)
    .single()

  if (!['starter', 'pro'].includes(usuario?.plan)) {
    return res.status(403).json({ error: 'Plan gestoría requerido' })
  }

  // GET — listar expedientes del gestor con datos de cliente y ayuda embebidos
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('expedientes')
      .select(`
        *,
        cliente:gestoria_clientes!expedientes_cliente_id_fkey ( id, cliente_nombre, cliente_email, dni ),
        ayuda:ayudas!expedientes_ayuda_id_fkey ( id, nombre, organismo, url_oficial, fecha_cierre, importe_max, tipo )
      `)
      .eq('gestor_id', gestorId)
      .order('updated_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ expedientes: data })
  }

  // POST — crear expediente (manual o aceptado desde la bandeja de matches)
  if (req.method === 'POST') {
    const { cliente_id, ayuda_id, importe_estimado, fecha_plazo_maximo, origen } = req.body
    if (!cliente_id || !ayuda_id) return res.status(400).json({ error: 'cliente_id y ayuda_id requeridos' })

    // Verificar que el cliente pertenece al gestor
    const { data: cli } = await supabaseAdmin
      .from('gestoria_clientes')
      .select('id')
      .eq('id', cliente_id)
      .eq('gestor_id', gestorId)
      .single()
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' })

    const { data, error } = await supabaseAdmin
      .from('expedientes')
      .insert({
        gestor_id: gestorId,
        cliente_id,
        ayuda_id,
        estado: 'nuevo',
        importe_estimado: importe_estimado ?? null,
        fecha_plazo_maximo: fecha_plazo_maximo ?? null,
        origen: origen === 'match' ? 'match' : 'manual',
      })
      .select()
      .single()

    if (error) {
      // 23505 = unique_violation (ya existe expediente para ese cliente+ayuda)
      if (error.code === '23505') return res.status(409).json({ error: 'Ya existe un expediente para este cliente y ayuda' })
      return res.status(500).json({ error: error.message })
    }

    // Log de actividad: creación
    await supabaseAdmin.from('expediente_actividad').insert({
      expediente_id: data.id,
      gestor_id: gestorId,
      tipo: 'creacion',
      descripcion: data.origen === 'match' ? 'Expediente creado desde la bandeja de matches' : 'Expediente creado manualmente',
      usuario: gestorId,
    })

    return res.json({ expediente: data })
  }

  // PUT — actualizar expediente (cambio de estado, fechas, honorarios, etc.)
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })

    const { data: existing } = await supabaseAdmin
      .from('expedientes')
      .select('id, estado')
      .eq('id', id)
      .eq('gestor_id', gestorId)
      .single()
    if (!existing) return res.status(404).json({ error: 'Expediente no encontrado' })

    if (updates.estado && !ESTADOS.includes(updates.estado)) {
      return res.status(400).json({ error: 'Estado no válido' })
    }

    const { data, error } = await supabaseAdmin
      .from('expedientes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('gestor_id', gestorId)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Log si cambió el estado
    if (updates.estado && updates.estado !== existing.estado) {
      await supabaseAdmin.from('expediente_actividad').insert({
        expediente_id: id,
        gestor_id: gestorId,
        tipo: 'cambio_estado',
        descripcion: `Estado: ${existing.estado} → ${updates.estado}`,
        usuario: gestorId,
      })
    }

    return res.json({ expediente: data })
  }

  // DELETE — eliminar expediente
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id requerido' })
    await supabaseAdmin
      .from('expedientes')
      .delete()
      .eq('id', id)
      .eq('gestor_id', gestorId)
    return res.json({ ok: true })
  }

  res.status(405).end()
}
