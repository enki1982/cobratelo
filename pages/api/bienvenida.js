import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })

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

  try {
    await transporter.sendMail({
      from: `"Cóbratelo.es" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Bienvenido/a a Cóbratelo.es',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#FFE2C4;font-family:sans-serif">
          <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
            
            <!-- Header -->
            <div style="background:#1a0d00;padding:28px 32px">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
                cóbratelo<span style="color:#FF8300">.es</span>
              </p>
            </div>

            <!-- Contenido -->
            <div style="padding:36px 32px">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1a0d00;letter-spacing:-0.5px">
                Ya tienes acceso a tus ayudas
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555550;line-height:1.6">
                Hemos identificado más de <strong>169 convocatorias activas</strong> en España. Ahora es el momento de descubrir cuáles te corresponden a ti.
              </p>

              <!-- CTA -->
              <a href="https://cobratelo.es/perfil" 
                style="display:inline-block;background:#1a0d00;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;margin-bottom:28px">
                Ver mis ayudas →
              </a>

              <!-- Pasos -->
              <div style="border-top:1px solid #F5C89A;padding-top:24px;margin-bottom:8px">
                <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#7a4a1a;text-transform:uppercase;letter-spacing:1px">Cómo funciona</p>
                ${[
                  ['01', 'Completa tu perfil', 'Cuéntanos tu situación en 2 minutos. Solo checkboxes, sin formularios.'],
                  ['02', 'Recibe tus resultados', 'Cruzamos tu perfil con todas las ayudas vigentes en España.'],
                  ['03', 'Cobra lo que te corresponde', 'Enlace directo a cada convocatoria oficial, listo para tramitar.'],
                ].map(([n, t, d]) => `
                  <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start">
                    <span style="background:#f0faf5;color:#cc5500;font-weight:800;font-size:12px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:28px;text-align:center">${n}</span>
                    <div>
                      <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#1a0d00">${t}</p>
                      <p style="margin:0;font-size:13px;color:#7a4a1a">${d}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Footer -->
            <div style="background:#FFE2C4;padding:20px 32px;border-top:1px solid #F5C89A">
              <p style="margin:0;font-size:12px;color:#b0aaa0;line-height:1.6">
                Cóbratelo.es · <a href="mailto:hola@cobratelo.es" style="color:#cc5500;text-decoration:none">hola@cobratelo.es</a><br>
                Los resultados son orientativos. Consulta siempre las fuentes oficiales.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('Error email bienvenida:', e.message)
    res.status(500).json({ error: e.message })
  }
}
