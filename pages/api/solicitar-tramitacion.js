import { createClient } from '@supabase/supabase-js'
import { enviarEmail } from '../../lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Extrae la CCAA y provincia del perfil del ciudadano (para el muro por region)
function regionDelPerfil(perfil) {
  const ccaa = perfil?.ccaa?.[0] || null
  const provincia = perfil?.provincia?.[0] || null
  return { ccaa, provincia }
}

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

    const { ccaa, provincia } = regionDelPerfil(perfil)

    const { data: nuevaSolicitud, error } = await supabaseAdmin
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
        ccaa,
        provincia,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (error) {
      console.error('solicitar-tramitacion insert error:', error.message)
      return res.status(500).json({ error: 'No se pudo registrar la solicitud' })
    }

    // NOTIFICAR por email (modelo A: muro abierto por region).
    // Si ya esta asignada a un gestor, notificar a ese. Si no, a todos los gestores de la CCAA.
    try {
      let destinatarios = []
      if (gestorId) {
        const { data: g } = await supabaseAdmin.from('usuarios').select('email').eq('id', gestorId).single()
        if (g?.email) destinatarios = [g.email]
      } else {
        // Gestores (plan starter/pro) de la misma CCAA. Su region esta en la tabla gestoria.
        const { data: gestores } = await supabaseAdmin
          .from('usuarios')
          .select('id, email, plan')
          .in('plan', ['starter', 'pro'])
        for (const ge of (gestores || [])) {
          if (!ge.email) continue
          // Filtrar por region: si la gestoria tiene CCAA definida y coincide, o si no tiene definida (recibe todo)
          const { data: perfilG } = await supabaseAdmin.from('gestoria').select('comunidad_autonoma').eq('id', ge.id).maybeSingle()
          const ccaaGestor = perfilG?.comunidad_autonoma || null
          if (!ccaaGestor || !ccaa || ccaaGestor === ccaa) destinatarios.push(ge.email)
        }
      }

      if (destinatarios.length > 0) {
        const importeTxt = (ayuda.importe_max || ayuda.importe_min)
          ? ' · hasta ' + new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(ayuda.importe_max || ayuda.importe_min)
          : ''
        const regionTxt = [provincia, ccaa].filter(Boolean).join(', ') || 'Sin región especificada'
        const html = `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#cc5500;font-size:18px">Nueva solicitud de tramitación en Cóbratelo.es</h2>
            <p style="color:#333;font-size:14px;line-height:1.6">Un ciudadano ha solicitado que una gestoría le tramite una ayuda:</p>
            <div style="background:#f7f4ef;border-radius:10px;padding:16px;margin:16px 0">
              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#222">${ayuda.nombre}</p>
              <p style="margin:0;font-size:13px;color:#666">${ayuda.organismo || ''}${importeTxt}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#cc5500;font-weight:600">📍 ${regionTxt}</p>
            </div>
            <p style="color:#333;font-size:14px;line-height:1.6">Entra en tu panel para atender esta solicitud antes de que la recoja otra gestoría:</p>
            <p style="margin:24px 0"><a href="https://www.cobratelo.es/gestor/expedientes" style="background:#cc5500;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Ver solicitud en mi panel</a></p>
            <p style="color:#999;font-size:12px;line-height:1.5">Las solicitudes se atienden por orden de llegada. La primera gestoría que la recoja se queda con el cliente.</p>
          </div>`
        await enviarEmail({ to: destinatarios, subject: `Nueva solicitud: ${ayuda.nombre} (${regionTxt})`, html })
      }
    } catch (eMail) {
      console.error('Error notificando gestorias:', eMail.message)
      // No bloquea: el lead ya esta guardado aunque el email falle
    }

    return res.json({ ok: true, asignadaAGestor: !!gestorId })
  } catch (e) {
    console.error('solicitar-tramitacion error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
