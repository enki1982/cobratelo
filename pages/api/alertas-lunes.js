import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Este endpoint lo llama Vercel Cron cada lunes a las 9:00
// También puede llamarse manualmente con ?secret=xxx

export const config = { maxDuration: 60 }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.forwardemail.net',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
})

export default async function handler(req, res) {
  // Seguridad: solo Vercel Cron o llamada manual con secret
  const auth = req.headers.authorization
  const secret = req.query.secret
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`
  const isManual = secret === process.env.CRON_SECRET

  if (!isCron && !isManual) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    // 1. Obtener todos los usuarios con perfil y email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const { data: usuariosDB } = await supabaseAdmin
      .from('usuarios')
      .select('id, perfil, alertas_enviadas')

    const perfilesMap = {}
    usuariosDB?.forEach(u => { perfilesMap[u.id] = u })

    // 2. Obtener ayudas nuevas (añadidas en los últimos 7 días)
    const hace7dias = new Date()
    hace7dias.setDate(hace7dias.getDate() - 7)

    const { data: ayudasNuevas } = await supabaseAdmin
      .from('ayudas')
      .select('*')
      .gte('created_at', hace7dias.toISOString())
      .order('created_at', { ascending: false })

    if (!ayudasNuevas?.length) {
      return res.json({ ok: true, mensaje: 'No hay ayudas nuevas esta semana', enviados: 0 })
    }

    // 3. Para cada usuario con perfil completo, filtrar ayudas relevantes y enviar
    let enviados = 0
    const errores = []

    for (const user of users) {
      if (!user.email) continue
      const dbUser = perfilesMap[user.id]
      if (!dbUser?.perfil || Object.keys(dbUser.perfil).length === 0) continue

      // Filtrar ayudas nuevas que aplican a este usuario
      const relevantes = ayudasNuevas.filter(a => aplicaAlUsuario(a, dbUser.perfil))
      if (!relevantes.length) continue

      try {
        await enviarAlerta(user.email, relevantes)
        enviados++

        // Actualizar fecha última alerta
        await supabaseAdmin
          .from('usuarios')
          .update({ alertas_enviadas: new Date().toISOString() })
          .eq('id', user.id)

        // Pequeña pausa para no saturar SMTP
        await new Promise(r => setTimeout(r, 300))
      } catch (e) {
        errores.push({ email: user.email, error: e.message })
      }
    }

    return res.json({
      ok: true,
      ayudasNuevas: ayudasNuevas.length,
      usuariosNotificados: enviados,
      errores,
    })
  } catch (e) {
    console.error('Error alertas-lunes:', e)
    return res.status(500).json({ error: e.message })
  }
}

function aplicaAlUsuario(ayuda, perfil) {
  if (!ayuda || !perfil) return false
  const situacion = perfil.situacion || []
  const t = (ayuda.nombre + ' ' + ayuda.descripcion + ' ' + (ayuda.organismo || '')).toLowerCase()

  // Exclusiones básicas
  if (/autónomos.*pymes|pymes.*autónomos|empresa.*electri/.test(t)) {
    if (!situacion.includes('autonomo') && !situacion.includes('emprendedor')) return false
  }

  // Edad
  if (ayuda.edad_min || ayuda.edad_max) {
    const edad = calcEdad(perfil.fecha_nacimiento)
    if (edad && ayuda.edad_min && edad < ayuda.edad_min) return false
    if (edad && ayuda.edad_max && edad > ayuda.edad_max) return false
  }

  return true
}

function calcEdad(fechaNac) {
  if (!fechaNac) return null
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let e = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
  return e
}

async function enviarAlerta(email, ayudas) {
  const ayudasHTML = ayudas.slice(0, 5).map(a => `
    <div style="border:1px solid #e0dad0;border-radius:12px;padding:16px;margin-bottom:12px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#111110">${a.nombre}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#888882">${a.organismo || ''}</p>
          <p style="margin:0;font-size:13px;color:#555550;line-height:1.5">${(a.descripcion || '').substring(0, 120)}${a.descripcion?.length > 120 ? '...' : ''}</p>
        </div>
        ${a.importe_max ? `<span style="background:#f0faf5;color:#2d6a4f;font-weight:800;font-size:14px;padding:4px 12px;border-radius:100px;white-space:nowrap;flex-shrink:0">${a.importe_max.toLocaleString('es-ES')}€</span>` : ''}
      </div>
      ${a.url ? `<a href="${a.url}" style="display:inline-block;margin-top:10px;font-size:12px;color:#2d6a4f;text-decoration:none;font-weight:600">Ver convocatoria oficial →</a>` : ''}
    </div>
  `).join('')

  const masAyudas = ayudas.length > 5
    ? `<p style="text-align:center;font-size:13px;color:#888882">Y ${ayudas.length - 5} ayudas más disponibles en tu panel.</p>` : ''

  await transporter.sendMail({
    from: `"Cóbratelo.es" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${ayudas.length} ayuda${ayudas.length > 1 ? 's nuevas' : ' nueva'} que te puede interesar`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f7f3ec;font-family:sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <div style="background:#111110;padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
            <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">cóbratelo<span style="color:#00e87a">.es</span></p>
            <span style="background:rgba(0,232,122,0.15);color:#00e87a;font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;border:1px solid rgba(0,232,122,0.3)">NOVEDADES DE LA SEMANA</span>
          </div>

          <div style="padding:28px 32px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111110;letter-spacing:-0.5px">
              ${ayudas.length} ayuda${ayudas.length > 1 ? 's nuevas' : ' nueva'} esta semana
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:#888882">Solo las novedades — sin repetir lo que ya conoces.</p>

            ${ayudasHTML}
            ${masAyudas}

            <a href="https://cobratelo.es/resultados"
              style="display:block;text-align:center;background:#111110;color:#fff;font-weight:700;font-size:15px;padding:14px 0;border-radius:100px;text-decoration:none;margin-top:8px">
              Ver todas mis ayudas →
            </a>
          </div>

          <div style="background:#f7f3ec;padding:16px 32px;border-top:1px solid #e0dad0">
            <p style="margin:0;font-size:11px;color:#b0aaa0;line-height:1.6">
              Cóbratelo.es · <a href="mailto:hola@cobratelo.es" style="color:#2d6a4f;text-decoration:none">hola@cobratelo.es</a><br>
              Recibes esto porque tienes alertas activas. <a href="https://cobratelo.es/cuenta" style="color:#b0aaa0">Gestionar preferencias</a>
            </p>
          </div>
        </div>
      </body></html>
    `,
  })
}
