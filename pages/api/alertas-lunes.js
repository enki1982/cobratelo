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
      .select('id, perfil, alertas_enviadas, alertas_activas')

    const perfilesMap = {}
    usuariosDB?.forEach(u => { perfilesMap[u.id] = u })

    // 2. Obtener solo las ayudas VIGENTES Y VERIFICADAS (activas, con plazo real futuro, no nominativas)
    const hoyISO = new Date().toISOString().slice(0, 10)
    const { data: todasAyudas } = await supabaseAdmin
      .from('ayudas')
      .select('*')
      .eq('activa', true)
      .gte('fecha_fin', hoyISO)
      .order('fecha_fin', { ascending: true })

    if (!todasAyudas?.length) {
      return res.json({ ok: true, mensaje: 'No hay ayudas en la BD', enviados: 0 })
    }

    // 3. Para cada usuario: recalcular sus ayudas (filtro + IA, vía calcular-ayudas)
    //    y enviarle un email simple con el NÚMERO de ayudas nuevas. El detalle lo ve en la web.
    let enviados = 0
    const errores = []
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cobratelo.es'

    for (const user of users) {
      if (!user.email) continue
      const dbUser = perfilesMap[user.id]
      if (!dbUser?.perfil || Object.keys(dbUser.perfil).length === 0) continue

      // Respetar la preferencia del usuario: si desactivó las alertas, no enviar.
      if (dbUser.alertas_activas === false) continue

      try {
        // Recalcular con el MISMO motor que la web (filtro de código + IA de sentido común).
        // calcular-ayudas guarda el resultado en ayudas_calculadas del usuario.
        const resp = await fetch(`${BASE_URL}/api/calcular-ayudas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, perfil: dbUser.perfil }),
        })
        if (!resp.ok) continue
        const data = await resp.json()
        const idsActuales = (data.ayudas || []).map(a => a.id)

        // Cuántas son NUEVAS respecto a las ya notificadas
        const yaVistos = new Set(dbUser.ayudas_alertadas || [])
        const nuevas = idsActuales.filter(id => !yaVistos.has(id))

        if (nuevas.length === 0) continue // nada nuevo que anunciar

        // Enviar email SIMPLE: solo el número, invitando a entrar a la web
        await enviarAlerta(user.email, nuevas.length, idsActuales.length)
        enviados++

        // Marcar como notificadas todas las actuales (para no repetir)
        await supabaseAdmin
          .from('usuarios')
          .update({
            alertas_enviadas: new Date().toISOString(),
            ayudas_alertadas: idsActuales,
          })
          .eq('id', user.id)

        await new Promise(r => setTimeout(r, 300))
      } catch (e) {
        errores.push({ email: user.email, error: e.message })
      }
    }

    return res.json({
      ok: true,
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

async function enviarAlerta(email, nuevas, total) {
  // Email SIMPLE: solo el número de ayudas nuevas, invitando a entrar a la web
  // (donde ya están filtradas por el sentido común / IA). No se listan ayudas aquí.
  const nTexto = nuevas === 1 ? '1 ayuda nueva' : `${nuevas} ayudas nuevas`
  const totalTexto = total === 1 ? '1 ayuda disponible' : `${total} ayudas disponibles`

  await transporter.sendMail({
    from: `"Cóbratelo.es" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Tienes ${nTexto} que te pueden interesar`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#FFE2C4;font-family:sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <div style="background:#1a0d00;padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
            <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">cóbratelo<span style="color:#FF8300">.es</span></p>
            <span style="background:rgba(255,131,0,0.15);color:#FF8300;font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;border:1px solid rgba(255,131,0,0.3)">NOVEDADES DE LA SEMANA</span>
          </div>

          <div style="padding:36px 32px;text-align:center">
            <div style="font-size:52px;font-weight:800;color:#FF8300;line-height:1;margin-bottom:8px">${nuevas}</div>
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a0d00;letter-spacing:-0.5px">
              ${nuevas === 1 ? 'ayuda nueva para ti' : 'ayudas nuevas para ti'}
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#7a4a1a;line-height:1.6">
              Hemos detectado ${nTexto} que encajan con tu perfil.<br>
              Entra para verlas en detalle.
            </p>

            <a href="https://cobratelo.es/resultados"
              style="display:inline-block;background:#1a0d00;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;text-decoration:none">
              Ver mis ayudas →
            </a>

            <p style="margin:24px 0 0;font-size:12px;color:#b0aaa0">
              En total tienes ${totalTexto} en tu panel.
            </p>
          </div>

          <div style="background:#FFE2C4;padding:16px 32px;border-top:1px solid #F5C89A">
            <p style="margin:0;font-size:11px;color:#b0aaa0;line-height:1.6">
              Cóbratelo.es · <a href="mailto:hola@cobratelo.es" style="color:#cc5500;text-decoration:none">hola@cobratelo.es</a><br>
              Recibes esto porque tienes alertas activas. <a href="https://cobratelo.es/cuenta" style="color:#b0aaa0">Gestionar preferencias</a>
            </p>
          </div>
        </div>
      </body></html>
    `,
  })
}
