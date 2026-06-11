import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function logAccess(req, { gestoriaId, ciudadanoId, action, metadata = {} }) {
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
               || req.socket?.remoteAddress || '0.0.0.0'
    await supabaseAdmin.from('access_logs').insert({
      gestoria_id: gestoriaId || null,
      ciudadano_id: ciudadanoId || null,
      action,
      ip,
      metadata
    })
  } catch (e) {
    console.error('access_log error:', e.message)
  }
}

// Acciones estándar
export const ACTIONS = {
  VIEW_PROFILE:       'VIEW_PROFILE',
  VIEW_EXPEDIENTE:    'VIEW_EXPEDIENTE',
  CREATE_EXPEDIENTE:  'CREATE_EXPEDIENTE',
  UPDATE_EXPEDIENTE:  'UPDATE_EXPEDIENTE',
  DELETE_EXPEDIENTE:  'DELETE_EXPEDIENTE',
  EXPORT_CSV:         'EXPORT_CSV',
  DOWNLOAD_DOCUMENT:  'DOWNLOAD_DOCUMENT',
  CREATE_CONSENT:     'CREATE_CONSENT',
  REVOKE_CONSENT:     'REVOKE_CONSENT',
  VIEW_MATCHES:       'VIEW_MATCHES',
}
