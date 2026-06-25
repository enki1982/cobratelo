import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { emailGestor, nombreCliente, ayudas, perfil, clienteId, emailUsuario } = req.body
  if (!emailGestor || !ayudas?.length) return res.status(400).json({ error: 'Faltan datos' })

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.forwardemail.net',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  })

  // Verificar conexión
  try {
    await transporter.verify()
  } catch (verifyErr) {
    console.error('SMTP verify failed:', verifyErr.message)
    return res.status(500).json({ error: 'Error de conexión SMTP', detail: verifyErr.message })
  }

  const nombre = nombreCliente || 'Su cliente'
  const nAyudas = ayudas.length

  // Montante total estimado (suma de importes máximos, lenguaje prudente "hasta")
  const montanteTotal = ayudas.reduce((sum, a) => sum + (Number(a.importe_max) || 0), 0)
  const montanteTxt = montanteTotal > 0
    ? `hasta ${montanteTotal.toLocaleString('es-ES')}€`
    : null

  // ¿El gestor está afiliado (plan de pago) o no? Decide qué email recibe.
  let planGestor = 'free'
  try {
    const { data: gestorRow } = await supabaseAdmin
      .from('usuarios').select('plan').eq('email', emailGestor).single()
    if (gestorRow?.plan) planGestor = gestorRow.plan
  } catch {}
  const esAfiliado = ['starter', 'pro'].includes(planGestor)

  const ayudasHtml = ayudas.slice(0, 8).map((a, i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div>
            <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:2px;">${a.nombre}</div>
            <div style="font-size:12px;color:#888;">${a.organismo}</div>
          </div>
          ${a.importe_max > 0 ? `<div style="font-size:13px;font-weight:700;color:#cc5500;white-space:nowrap;flex-shrink:0;">Hasta ${a.importe_max.toLocaleString('es-ES')}€</div>` : ''}
        </div>
      </td>
    </tr>
  `).join('')

  const masAyudas = ayudas.length > 8 ? `<p style="margin:12px 0 0;font-size:12px;color:#888;">+ ${ayudas.length - 8} ayudas más disponibles en la plataforma.</p>` : ''

  // === EMAIL COMPLETO (solo afiliados: starter/pro) ===
  const htmlAfiliado = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:580px;margin:32px auto;padding:0 16px;">

  <!-- Card -->
  <div style="background:#ffffff;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">

    <!-- Top bar -->
    <div style="padding:20px 32px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:15px;font-weight:700;color:#111;letter-spacing:-0.3px;">cóbratelo<span style="color:#cc5500;">.es</span></span>
      <span style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.05em;">Notificación de nuevo cliente</span>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:13px;color:#888;">Ha recibido una solicitud de:</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.5px;">${nombre}</h1>

      <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.65;">
        Este ciudadano ha completado su cuestionario en Cóbratelo.es y le ha autorizado expresamente
        a acceder a su perfil para ayudarle a tramitar las siguientes ayudas públicas:
      </p>

      <!-- Lista ayudas -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:6px;padding:4px 16px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${ayudasHtml}
        </table>
        ${masAyudas}
      </div>

      <!-- CTA -->
      <div style="margin-bottom:24px;">
        <a href="https://cobratelo.es/gestor/expedientes"
           style="display:inline-block;background:#cc5500;color:#ffffff;text-decoration:none;
                  font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;letter-spacing:-0.2px;">
          Ver cliente en mi panel →
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
        Acceda a su panel para ver el perfil completo, gestionar el expediente y comunicarse con el cliente.
        El consentimiento RGPD ha sido registrado automáticamente.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11px;color:#bbb;">cóbratelo.es · hola@cobratelo.es</span>
      <a href="https://cobratelo.es/gestores" style="font-size:11px;color:#bbb;text-decoration:none;">¿Qué es Cóbratelo.es?</a>
    </div>

  </div>

  <p style="text-align:center;font-size:11px;color:#bbb;margin:16px 0;">
    Ha recibido este email porque un ciudadano le ha seleccionado como gestor en Cóbratelo.es.
  </p>

</div>
</body>
</html>`

  // === EMAIL GANCHO (no afiliados: free / no registrados) ===
  // Solo identifica al cliente + nº de ayudas + montante. Sin detalle accionable.
  const htmlGancho = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:580px;margin:32px auto;padding:0 16px;">

  <div style="background:#ffffff;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">

    <div style="padding:20px 32px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:15px;font-weight:700;color:#111;letter-spacing:-0.3px;">cóbratelo<span style="color:#cc5500;">.es</span></span>
      <span style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.05em;">Nuevo cliente potencial</span>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:13px;color:#888;">Uno de sus clientes le ha seleccionado:</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.5px;">${nombre}</h1>

      <div style="background:#fafafa;border:1px solid #eee;border-radius:6px;padding:20px;margin-bottom:22px;text-align:center;">
        <div style="font-size:13px;color:#888;margin-bottom:6px;">Le hemos detectado</div>
        <div style="font-size:30px;font-weight:800;color:#cc5500;letter-spacing:-1px;line-height:1.1;">${nAyudas} ${nAyudas === 1 ? 'ayuda' : 'ayudas'}</div>
        ${montanteTxt ? `<div style="font-size:14px;color:#444;margin-top:6px;">por un importe estimado de <strong>${montanteTxt}</strong></div>` : ''}
      </div>

      <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.65;">
        Este ciudadano ha completado su cuestionario en Cóbratelo.es y le ha seleccionado como su gestoría de confianza para tramitar estas ayudas.
      </p>

      <p style="margin:0 0 22px;font-size:14px;color:#444;line-height:1.65;">
        <strong>Cóbratelo.es</strong> conecta a ciudadanos, autónomos y empresas con las ayudas y subvenciones públicas a las que tienen derecho, y se las presenta a su gestoría ya cualificadas. Para ver el detalle de estas ayudas, acceder a los datos del cliente y gestionar el expediente, únase a la plataforma.
      </p>

      <div style="margin-bottom:24px;">
        <a href="https://cobratelo.es/gestores"
           style="display:inline-block;background:#cc5500;color:#ffffff;text-decoration:none;
                  font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;letter-spacing:-0.2px;">
          Unirme y ver las ayudas →
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
        Al unirse, podrá ver el detalle completo de las ayudas detectadas, integrar al cliente en su CRM y gestionar todo el expediente desde un único lugar.
      </p>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11px;color:#bbb;">cóbratelo.es · hola@cobratelo.es</span>
      <a href="https://cobratelo.es/gestores" style="font-size:11px;color:#bbb;text-decoration:none;">¿Qué es Cóbratelo.es?</a>
    </div>

  </div>

  <p style="text-align:center;font-size:11px;color:#bbb;margin:16px 0;">
    Ha recibido este email porque un ciudadano le ha seleccionado como gestor en Cóbratelo.es.
  </p>

</div>
</body>
</html>`

  // Elegir email según afiliación
  const html = esAfiliado ? htmlAfiliado : htmlGancho
  const subjectGestor = esAfiliado
    ? `${nombre} tiene ${nAyudas} ayudas públicas pendientes de tramitar`
    : `${nombre} tiene ${nAyudas} ${nAyudas === 1 ? 'ayuda' : 'ayudas'} esperándole en Cóbratelo.es`

  try {
    await transporter.sendMail({
      from: '"Cóbratelo.es" <hola@cobratelo.es>',
      to: emailGestor,
      subject: subjectGestor,
      html,
    })

    // Copia al usuario si se proporcionó su email
    if (emailUsuario && emailUsuario !== emailGestor) {
      await transporter.sendMail({
        from: '"Cóbratelo.es" <hola@cobratelo.es>',
        to: emailUsuario,
        subject: `Hemos enviado tus ${nAyudas} ayudas a tu gestoría`,
        html: htmlAfiliado,
      })
    }

    // Guardar invitación pendiente para que cuando la gestoría se registre vea al cliente
    try {
      await supabaseAdmin.from('gestoria_invitaciones').insert({
        gestor_email: emailGestor,
        cliente_email: perfil?.email || null,
        cliente_nombre: nombreCliente || null,
        cliente_id: clienteId || null,
        ayudas_ids: ayudas.map(a => a.id).filter(Boolean),
      })
    } catch {} // No bloquear si falla el guardado

    // Registrar consentimiento con IP real + lookup gestoria_id
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                 || req.socket?.remoteAddress || '0.0.0.0'
      const { userId } = req.body
      const ciudadanoId = userId || clienteId || null

      // Buscar gestoria_id por email (si está registrada en la plataforma)
      let gestoriaId = null
      try {
        const { data: gestor } = await supabaseAdmin
          .from('usuarios').select('id').eq('email', emailGestor).single()
        if (gestor) gestoriaId = gestor.id
      } catch {}

      if (ciudadanoId) {
        const TEXTO = 'Autorizo expresamente a Cóbratelo.es a comunicar mis datos personales y la información necesaria de mi expediente a la gestoría seleccionada, para que pueda contactarme y prestarme servicios profesionales relacionados con la gestión de ayudas y subvenciones.'
        await supabaseAdmin.from('consentimientos_gestor').insert({
          ciudadano_id: ciudadanoId,
          gestor_id: gestoriaId,
          email_gestor: emailGestor,
          ip: ip,
          version_legal: 'v1-junio-2026',
          texto_aceptado: TEXTO,
          activo: true
        })

        // Log funnel: gestoría solicitada
        await supabaseAdmin.from('access_logs').insert({
          gestoria_id: gestoriaId,
          ciudadano_id: ciudadanoId,
          action: 'GESTORIA_REQUESTED',
          ip: ip,
          metadata: { email_gestor: emailGestor }
        })
        // Log de acceso: CREATE_CONSENT
        await supabaseAdmin.from('access_logs').insert({
          gestoria_id: gestoriaId,
          ciudadano_id: ciudadanoId,
          action: 'CREATE_CONSENT',
          ip: ip,
          metadata: { email_gestor: emailGestor, version_legal: 'v1-junio-2026' }
        })
      }
    } catch (e2) {
      console.error('Error guardando consentimiento:', e2.message)
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Error enviando email gestor:', e)
    res.status(500).json({ error: 'Error enviando el email' })
  }
}
