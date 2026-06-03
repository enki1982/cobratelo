import nodemailer from 'nodemailer'

// Transporter único (Forward Email), reutilizado por alertas y notificaciones.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.forwardemail.net',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
})

// Envía un email. `to` puede ser string o array de strings.
export async function enviarEmail({ to, subject, html }) {
  if (!to || (Array.isArray(to) && to.length === 0)) return { ok: false, error: 'Sin destinatarios' }
  try {
    await transporter.sendMail({
      from: `"Cóbratelo.es" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    })
    return { ok: true }
  } catch (e) {
    console.error('Error enviando email:', e.message)
    return { ok: false, error: e.message }
  }
}
