import { createClient } from '@supabase/supabase-js'
import { enviarEmail } from '../../lib/email'
import { construirVencimientos, vencimientosUrgentes } from '../../lib/vencimientos'

export const config = { maxDuration: 60 }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Llamado por Vercel Cron los lunes. También manual con ?secret=xxx
export default async function handler(req, res) {
  const auth = req.headers.authorization
  const secret = req.query.secret
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`
  const isManual = secret === process.env.CRON_SECRET
  if (!isCron && !isManual) return res.status(401).json({ error: 'No autorizado' })

  try {
    // Gestores (plan starter/pro) con al menos un correo de alertas configurado
    const { data: gestores } = await supabaseAdmin
      .from('usuarios')
      .select('id, alertas_emails, plan')
      .in('plan', ['starter', 'pro'])

    const conDestinatarios = (gestores || []).filter(g => Array.isArray(g.alertas_emails) && g.alertas_emails.length > 0)
    let enviados = 0

    for (const g of conDestinatarios) {
      // Cargar expedientes del gestor + documentos + tareas
      const { data: expedientes } = await supabaseAdmin
        .from('expedientes')
        .select(`id, estado, fecha_plazo_maximo, fecha_resolucion,
          cliente:gestoria_clientes!expedientes_cliente_id_fkey ( cliente_nombre, cliente_email ),
          ayuda:ayudas!expedientes_ayuda_id_fkey ( nombre )`)
        .eq('gestor_id', g.id)

      const ids = (expedientes || []).map(e => e.id)
      let documentos = [], tareas = []
      if (ids.length > 0) {
        const [d, t] = await Promise.all([
          supabaseAdmin.from('expediente_documentos').select('expediente_id, nombre, fecha_caducidad, bloqueante, estado').in('expediente_id', ids),
          supabaseAdmin.from('expediente_tareas').select('expediente_id, titulo, fecha_vencimiento, completada').in('expediente_id', ids),
        ])
        documentos = d.data || []
        tareas = t.data || []
      }

      const todos = construirVencimientos({ expedientes: expedientes || [], documentos, tareas })
      const urgentes = vencimientosUrgentes(todos)
      if (urgentes.length === 0) continue   // sin urgencias, no molestamos

      // Email-resumen breve (recordatorio que empuja al panel)
      const filas = urgentes.slice(0, 12).map(v => {
        const cuando = v.dias < 0 ? `vencido hace ${-v.dias} día(s)` : `en ${v.dias} día(s)`
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;font-size:14px;color:#111">${v.etiqueta}<br><span style="color:#888;font-size:12px">${v.cliente} · ${v.ayuda}</span></td><td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:${v.dias<0?'#DC2626':'#D97706'};text-align:right;white-space:nowrap">${cuando}</td></tr>`
      }).join('')

      const html = `
        <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#cc5500;font-size:18px">Vencimientos de esta semana</h2>
          <p style="color:#555;font-size:14px">Tienes ${urgentes.length} vencimiento(s) que requieren atención. Resumen:</p>
          <table style="width:100%;border-collapse:collapse">${filas}</table>
          <p style="margin-top:24px"><a href="https://www.cobratelo.es/gestor/expedientes" style="background:#cc5500;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Ver detalle en el panel →</a></p>
          <p style="color:#999;font-size:12px;margin-top:20px">Recordatorio automático de Cóbratelo.es. El detalle completo está siempre en tu panel.</p>
        </div>`

      const r = await enviarEmail({
        to: g.alertas_emails,
        subject: `Cóbratelo · ${urgentes.length} vencimiento(s) esta semana`,
        html,
      })
      if (r.ok) enviados++
    }

    return res.json({ ok: true, gestores_con_destinatarios: conDestinatarios.length, emails_enviados: enviados })
  } catch (e) {
    console.error('Error en alertas-vencimientos:', e)
    return res.status(500).json({ error: e.message })
  }
}
