import { createClient } from '@supabase/supabase-js'
import { logAccess, ACTIONS } from '../../../lib/access-log'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verificar sesión del ciudadano
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Sesión inválida' })

  const { gestoriaId, emailGestor } = req.body
  if (!gestoriaId && !emailGestor) return res.status(400).json({ error: 'Falta gestoriaId o emailGestor' })

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '0.0.0.0'

  try {
    // 1. Marcar consentimiento como revocado
    const query = supabaseAdmin.from('consentimientos_gestor')
      .update({ activo: false, revocado_at: new Date().toISOString() })
      .eq('ciudadano_id', user.id)
      .eq('activo', true)

    if (gestoriaId) query.eq('gestor_id', gestoriaId)
    else if (emailGestor) query.eq('email_gestor', emailGestor)

    await query

    // 2. Eliminar al ciudadano de los expedientes activos de esa gestoría
    // (marcar como revocado, no borrar — preservar para auditoría)
    if (gestoriaId) {
      await supabaseAdmin.from('expedientes')
        .update({ estado: 'revocado_por_ciudadano' })
        .eq('ciudadano_id', user.id)
        .eq('gestor_id', gestoriaId)
        .not('estado', 'in', '(cerrada,denegada)')
    }

    // 3. Log de auditoría
    await logAccess(req, {
      gestoriaId: gestoriaId || null,
      ciudadanoId: user.id,
      action: ACTIONS.REVOKE_CONSENT,
      metadata: { email_gestor: emailGestor, gestoria_id: gestoriaId }
    })

    res.status(200).json({ ok: true, message: 'Consentimiento revocado. La gestoría ya no puede acceder a tus datos.' })
  } catch (e) {
    console.error('Error revoking consent:', e)
    res.status(500).json({ error: 'Error al revocar el consentimiento' })
  }
}
