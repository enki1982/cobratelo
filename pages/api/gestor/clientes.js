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

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  // Verificar plan gestoría
  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('plan')
    .eq('id', gestorId)
    .single()

  if (!['starter', 'pro'].includes(usuario?.plan)) {
    return res.status(403).json({ error: 'Plan gestoría requerido' })
  }

  if (req.method === 'GET') {
    // Listar clientes del gestor
    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .select('*')
      .eq('gestor_id', gestorId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ clientes: data })
  }

  if (req.method === 'POST') {
    // Añadir cliente
    const { cliente_email, cliente_nombre, dni, telefono, notas, ayudas_ids } = req.body
    if (!cliente_email) return res.status(400).json({ error: 'Email requerido' })

    // Límite de clientes para plan starter
    if (usuario.plan === 'starter') {
      const { count } = await supabaseAdmin
        .from('gestoria_clientes')
        .select('id', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
      if (count >= 50) return res.status(403).json({ error: 'Límite de 50 clientes alcanzado' })
    }

    // Buscar si el cliente ya tiene cuenta
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const clienteUser = users?.users?.find(u => u.email === cliente_email)

    // Obtener ayudas calculadas del cliente si está registrado
    let ayudasIds = ayudas_ids || []
    if (clienteUser) {
      const { data: clienteData } = await supabaseAdmin
        .from('usuarios')
        .select('ayudas_calculadas')
        .eq('id', clienteUser.id)
        .single()
      if (clienteData?.ayudas_calculadas?.length) {
        ayudasIds = clienteData.ayudas_calculadas
      }
    }

    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .insert({
        gestor_id: gestorId,
        cliente_email,
        cliente_nombre: cliente_nombre || '',
        cliente_id: clienteUser?.id || null,
        dni: dni || null,
        telefono: telefono || null,
        notas: notas || null,
        ayudas_ids: ayudasIds,
        estado: 'activo',
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ cliente: data })
  }

  if (req.method === 'PUT') {
    // Actualizar cliente
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })

    // Verificar que el cliente pertenece al gestor
    const { data: existing } = await supabaseAdmin
      .from('gestoria_clientes')
      .select('id')
      .eq('id', id)
      .eq('gestor_id', gestorId)
      .single()

    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' })

    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ cliente: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id requerido' })

    await supabaseAdmin
      .from('gestoria_clientes')
      .delete()
      .eq('id', id)
      .eq('gestor_id', gestorId)

    return res.json({ ok: true })
  }

  res.status(405).end()
}
