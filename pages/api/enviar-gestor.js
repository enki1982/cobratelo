import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { emailGestor, nombreCliente, ayudas, perfil } = req.body
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

  const ayudasHtml = ayudas.map((a, i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ead0;">
        <div style="font-weight:600;color:#111110;font-size:14px;">${i + 1}. ${a.nombre}</div>
        <div style="color:#888882;font-size:12px;margin-top:2px;">${a.organismo}</div>
        ${a.importe_max > 0 ? `<div style="color:#cc5500;font-weight:700;font-size:13px;margin-top:3px;">Hasta ${a.importe_max.toLocaleString('es-ES')}€</div>` : ''}
        ${a.descripcion ? `<div style="color:#666660;font-size:12px;margin-top:4px;">${a.descripcion}</div>` : ''}
        ${a.url_oficial ? `<div style="margin-top:5px;"><a href="${a.url_oficial}" style="color:#cc5500;font-size:12px;">Ver convocatoria oficial →</a></div>` : ''}
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0dad0;">

    <!-- Header -->
    <div style="background:#111110;padding:32px 40px;">
      <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
        cóbratelo<span style="color:#cc5500;">.es</span>
      </div>
      <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px;">Ayudas públicas personalizadas</div>
    </div>

    <!-- Intro -->
    <div style="padding:32px 40px 24px;">
      <h2 style="margin:0 0 12px;color:#111110;font-size:20px;font-weight:700;">
        ${nombre} tiene ${nAyudas} ayudas pendientes de tramitar
      </h2>
      <p style="margin:0;color:#555550;font-size:15px;line-height:1.6;">
        Hemos analizado su perfil y hemos identificado <strong>${nAyudas} ayudas públicas</strong> a las que tiene derecho.
        Nos ha facilitado su contacto para que pueda ayudarle a tramitarlas.
      </p>
    </div>

    <!-- Ayudas -->
    <div style="padding:0 40px 24px;">
      <div style="background:#f7f3ec;border-radius:12px;padding:20px 24px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888882;font-weight:600;margin-bottom:12px;">
          Ayudas identificadas
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${ayudasHtml}
        </table>
      </div>
    </div>

    <!-- Pitch -->
    <div style="padding:0 40px 32px;">
      <div style="border:1px solid #e0dad0;border-radius:12px;padding:24px;">
        <h3 style="margin:0 0 10px;color:#111110;font-size:16px;font-weight:700;">
          ¿Conoce Cóbratelo.es?
        </h3>
        <p style="margin:0 0 12px;color:#555550;font-size:14px;line-height:1.6;">
          Somos la plataforma que identifica automáticamente todas las ayudas, subvenciones y
          prestaciones públicas a las que tiene derecho cada ciudadano. Analizamos el perfil
          del usuario y cruzamos más de 200 convocatorias activas en tiempo real.
        </p>
        <p style="margin:0 0 16px;color:#555550;font-size:14px;line-height:1.6;">
          Si trabaja con particulares o autónomos, Cóbratelo.es puede ser una herramienta
          muy útil para detectar oportunidades para sus clientes antes de que caduquen.
        </p>
        <a href="https://cobratelo.es/precios" style="display:inline-block;background:#cc5500;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:50px;">
          Ver planes para gestorías →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #f0ead0;text-align:center;">
      <p style="margin:0;color:#b0aaa0;font-size:12px;">
        Cóbratelo.es · KIESBROTER SL (NIF: B65417107) · Mataró, Barcelona<br>
        <a href="https://cobratelo.es" style="color:#888882;">cobratelo.es</a>
      </p>
    </div>

  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: '"Cóbratelo.es" <hola@cobratelo.es>',
      to: emailGestor,
      subject: `${nombre} tiene ${nAyudas} ayudas públicas pendientes de tramitar`,
      html,
    })
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Error enviando email gestor:', e)
    res.status(500).json({ error: 'Error enviando el email' })
  }
}
