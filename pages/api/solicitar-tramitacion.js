import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// El ciudadano solicita que una gestoria le tramite UNA ayuda concreta.
// Si ya esta vinculado a un gestor (es su cliente), la solicitud va a ese gestor.
// Si no, queda en el pool (gestor_id null) para que cualquier gestoria la recoja.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { ciudadanoId, perfil, ayuda } = req.body
  if (!ayuda?.id || !ayuda?.nombre) {
    return res.status(400).json({ error: 'Falta la ayuda' })
  }

  try {
    // Datos del ciudadano (email/nombre) si esta logado
    let ciudadanoEmail = null
    let ciudadanoNombre = null
    if (ciudadanoId) {
      const { data: u } = await supabaseAdmin
        .from('usuarios')
        .select('email, nombre')
        .eq('id', ciudadanoId)
        .single()
      ciudadanoEmail = u?.email || null
      ciudadanoNombre = u?.nombre || null
    }

    // Evitar duplicados: misma ayuda + mismo ciudadano aun pendiente
    if (ciudadanoId) {
      const { data: existente } = await supabaseAdmin
        .from('solicitudes_tramitacion')
        .select('id')
        .eq('ciudadano_id', ciudadanoId)
        .eq('ayuda_id', ayuda.id)
        .eq('estado', 'pendiente')
        .maybeSingle()
      if (existente) {
        return res.json({ ok: true, yaExistia: true })
      }
    }

    // Si el ciudadano ya es cliente de una gestoria, asignarsela
    let gestorId = null
    if (ciudadanoId) {
      const { data: vinculo } = await supabaseAdmin
        .from('gestoria_clientes')
        .select('gestor_id')
        .eq('cliente_id', ciudadanoId)
        .limit(1)
        .maybeSingle()
      gestorId = vinculo?.gestor_id || null
    }

    const { error } = await supabaseAdmin
      .from('solicitudes_tramitacion')
      .insert({
        ciudadano_id: ciudadanoId || null,
        ciudadano_email: ciudadanoEmail,
        ciudadano_nombre: ciudadanoNombre,
        ayuda_id: ayuda.id,
        ayuda_nombre: ayuda.nombre,
        ayuda_organismo: ayuda.organismo || null,
        ayuda_importe: ayuda.importe_max || ayuda.importe_min || null,
        perfil: perfil || {},
        gestor_id: gestorId,
        estado: 'pendiente',
      })

    if (error) {
      console.error('solicitar-tramitacion insert error:', error.message)
      return res.status(500).json({ error: 'No se pudo registrar la solicitud' })
    }

    return res.json({ ok: true, asignadaAGestor: !!gestorId })
  } catch (e) {
    console.error('solicitar-tramitacion error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
