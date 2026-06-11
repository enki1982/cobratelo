import { createClient } from '@supabase/supabase-js'
import { calcularRelevancia } from '../../../lib/relevancia'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getGestorId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['sb-access-token']
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id || null
}

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoria requerido' })

  // Clientes del gestor que tengan perfil (propio o en usuarios enlazado)
  const { data: clientes } = await supabaseAdmin
    .from('gestoria_clientes')
    .select('id, cliente_nombre, cliente_email, cliente_id, perfil')
    .eq('gestor_id', gestorId)

  const conPerfil = []
  for (const c of (clientes || [])) {
    let perfil = c.perfil
    if ((!perfil || Object.keys(perfil).length === 0) && c.cliente_id) {
      const { data: u } = await supabaseAdmin.from('usuarios').select('perfil').eq('id', c.cliente_id).single()
      perfil = u?.perfil
    }
    if (perfil && Object.keys(perfil).length > 0) conPerfil.push({ ...c, perfil })
  }

  // Ayudas activas
  const { data: ayudas } = await supabaseAdmin
    .from('ayudas')
    .select('id, nombre, organismo, tipo, importe_max, importe_min, fecha_cierre, url_oficial, ambito, comunidad_autonoma, es_nominativa, entidades_geo, tipo_beneficiario, renta_max, edad_min, edad_max')
    .eq('activa', true)

  // Expedientes y descartes existentes, para no reproponer
  const { data: expedientes } = await supabaseAdmin.from('expedientes').select('cliente_id, ayuda_id').eq('gestor_id', gestorId)
  const { data: descartes } = await supabaseAdmin.from('expediente_descartes').select('cliente_id, ayuda_id').eq('gestor_id', gestorId)
  const yaTratado = new Set()
  ;(expedientes || []).forEach(e => yaTratado.add(e.cliente_id + '|' + e.ayuda_id))
  ;(descartes || []).forEach(d => yaTratado.add(d.cliente_id + '|' + d.ayuda_id))

  const matches = []
  for (const c of conPerfil) {
    const puntuadas = (ayudas || [])
      .map(a => ({ a, score: calcularRelevancia(a, c.perfil) }))
      .filter(x => x.score >= 40)
      .filter(x => !yaTratado.has(c.id + '|' + x.a.id))
      .sort((x, y) => y.score - x.score)
      .slice(0, 10)
    for (const p of puntuadas) {
      matches.push({
        cliente_id: c.id,
        cliente_nombre: c.cliente_nombre || c.cliente_email,
        ayuda_id: p.a.id,
        ayuda_nombre: p.a.nombre,
        organismo: p.a.organismo,
        importe_max: p.a.importe_max,
        fecha_cierre: p.a.fecha_cierre,
        score: p.score,
      })
    }
  }
  matches.sort((a, b) => b.score - a.score)

  return res.json({ matches, clientes_con_perfil: conPerfil.length, clientes_total: (clientes || []).length })
}
