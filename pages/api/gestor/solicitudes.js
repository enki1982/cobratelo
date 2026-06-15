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
      // 1. Marcar la solicitud como en gestion y asignarla a este gestor
      const { data: sol, error: errSol } = await supabaseAdmin
        .from('solicitudes_tramitacion')
        .update({ gestor_id: gestorId, estado: 'en_gestion' })
        .eq('id', solicitud_id)
        .or(`gestor_id.is.null,gestor_id.eq.${gestorId}`)
        .select()
        .single()
      if (errSol) return res.status(500).json({ error: errSol.message })
      if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' })

      // 2. Asegurar que el ciudadano es cliente de esta gestoria (gestoria_clientes)
      let clienteGestoriaId = null
      // Buscar si ya existe el vinculo (por cliente_id o por email)
      const { data: existente } = await supabaseAdmin
        .from('gestoria_clientes')
        .select('id')
        .eq('gestor_id', gestorId)
        .or(`cliente_id.eq.${sol.ciudadano_id || '00000000-0000-0000-0000-000000000000'},cliente_email.eq.${sol.ciudadano_email || 'none@none.none'}`)
        .maybeSingle()

      if (existente) {
        clienteGestoriaId = existente.id
      } else {
        const { data: nuevoCli, error: errCli } = await supabaseAdmin
          .from('gestoria_clientes')
          .insert({
            gestor_id: gestorId,
            cliente_id: sol.ciudadano_id || null,
            cliente_email: sol.ciudadano_email || null,
            cliente_nombre: sol.ciudadano_nombre || sol.ciudadano_email || 'Cliente de Cóbratelo',
            perfil: sol.perfil || {},
          })
          .select()
          .single()
        if (errCli) {
          console.error('Error creando cliente al recoger:', errCli.message)
          return res.status(500).json({ error: 'Solicitud recogida pero no se pudo crear el cliente: ' + errCli.message })
        }
        clienteGestoriaId = nuevoCli.id
      }

      // 3. Crear el expediente con la ayuda solicitada (si no existe ya)
      if (clienteGestoriaId && sol.ayuda_id) {
        const { data: expExiste } = await supabaseAdmin
          .from('expedientes')
          .select('id')
          .eq('gestor_id', gestorId)
          .eq('cliente_id', clienteGestoriaId)
          .eq('ayuda_id', sol.ayuda_id)
          .maybeSingle()
        if (!expExiste) {
          const { data: exp } = await supabaseAdmin
            .from('expedientes')
            .insert({
              gestor_id: gestorId,
              cliente_id: clienteGestoriaId,
              ayuda_id: sol.ayuda_id,
              estado: 'nuevo',
              importe_estimado: sol.ayuda_importe || null,
              origen: 'manual',
            })
            .select()
            .single()
          if (exp) {
            await supabaseAdmin.from('expediente_actividad').insert({
              expediente_id: exp.id,
              gestor_id: gestorId,
              descripcion: 'Expediente creado desde una solicitud del cliente',
            })
          }
        }
      }

      return res.json({ ok: true, clienteId: clienteGestoriaId })
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
