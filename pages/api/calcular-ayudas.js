import { createClient } from '@supabase/supabase-js'
import { calcularRelevancia } from '../../lib/relevancia'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, perfil } = req.body
  if (!userId || !perfil) return res.status(400).json({ error: 'userId y perfil requeridos' })

  try {
    // Fetch todas las ayudas activas con solo los campos necesarios
    const { data: ayudas } = await supabaseAdmin
      .from('ayudas')
      .select('id,nombre,descripcion,palabras_clave,organismo,ambito,comunidad_autonoma,slug,tipo,estado,importe_min,importe_max,importe_descripcion,url_oficial,fecha_fin,created_at')
      .in('estado', ['abierta', 'permanente', 'pendiente'])

    // Calcular relevancia server-side
    const conScore = (ayudas || [])
      .map(a => ({ ...a, _score: calcularRelevancia(a, perfil) }))
      .filter(a => a._score >= 40)
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)

    // Guardar IDs en Supabase para cache
    await supabaseAdmin
      .from('usuarios')
      .update({ ayudas_calculadas: conScore.map(a => a.id) })
      .eq('id', userId)

    return res.json({ ok: true, ayudas: conScore })
  } catch (e) {
    console.error('Error calcular-ayudas:', e)
    return res.status(500).json({ error: e.message })
  }
}
