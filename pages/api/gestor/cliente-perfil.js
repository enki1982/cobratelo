import { createClient } from '@supabase/supabase-js'

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
  if (req.method !== 'POST') return res.status(405).end()
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })
  const { data: usuario } = await supabaseAdmin.from('usuarios').select('plan').eq('id', gestorId).single()
  if (!['starter', 'pro'].includes(usuario?.plan)) return res.status(403).json({ error: 'Plan gestoria requerido' })

  const { cliente_id, perfil } = req.body
  if (!cliente_id || !perfil) return res.status(400).json({ error: 'cliente_id y perfil requeridos' })

  // Verificar que el cliente es del gestor
  const { data: cli } = await supabaseAdmin
    .from('gestoria_clientes').select('id, cliente_id').eq('id', cliente_id).eq('gestor_id', gestorId).single()
  if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' })

  // Guardar el perfil en el cliente de gestoria
  const { error } = await supabaseAdmin.from('gestoria_clientes').update({ perfil }).eq('id', cliente_id)
  if (error) return res.status(500).json({ error: error.message })

  // Si el cliente tiene usuario enlazado, guardarlo tambien en usuarios.perfil
  if (cli.cliente_id) {
    await supabaseAdmin.from('usuarios').update({ perfil }).eq('id', cli.cliente_id)
  }

  // Detectar automáticamente las ayudas que le corresponden al cliente
  // (mismo motor que el lado ciudadano: filtro + IA), sin guardar en usuarios.
  let ayudasDetectadas = []
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cobratelo.es'
    const r = await fetch(`${base}/api/calcular-ayudas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfil, soloCalcular: true }),
    })
    if (r.ok) {
      const d = await r.json()
      ayudasDetectadas = (d.ayudas || []).map(a => a.id)
      // Guardar los IDs detectados en el cliente de gestoría
      await supabaseAdmin.from('gestoria_clientes')
        .update({ ayudas_detectadas: ayudasDetectadas })
        .eq('id', cliente_id)
    }
  } catch (e) {
    // Si la detección falla, el perfil ya se guardó; el gestor puede añadir ayudas a mano
    console.error('deteccion ayudas cliente error:', e.message)
  }

  return res.json({ ok: true, ayudas_detectadas: ayudasDetectadas.length })
}
