import Anthropic from '@anthropic-ai/sdk'
import { logAccess, ACTIONS } from '../../lib/access-log'
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

  // Verificar que userId pertenece a la sesión activa
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['sb-access-token']
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user && user.id !== userId) return res.status(403).json({ error: 'userId no coincide con la sesión' })
  }

  try {
    // Fetch todas las ayudas activas con solo los campos necesarios
    const { data: ayudas } = await supabaseAdmin
      .from('ayudas')
      .select('id,nombre,descripcion,palabras_clave,organismo,ambito,comunidad_autonoma,slug,tipo,estado,importe_min,importe_max,importe_descripcion,url_oficial,fecha_fin,created_at,es_nominativa,entidades_geo,tipo_beneficiario,sectores,renta_max,edad_min,edad_max')
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

    // Funnel events
    try {
      await logAccess(req, { ciudadanoId: userId, action: ACTIONS.QUESTIONNAIRE_COMPLETED, metadata: { total: conScore.length } })
      if (conScore.length > 0) await logAccess(req, { ciudadanoId: userId, action: ACTIONS.MATCH_FOUND, metadata: { matches: conScore.length } })
    } catch {}
    // Filtro de sentido común en el servidor (sin depender de sesión del cliente)
    let ayudasFinal = conScore.slice(0, 20)
    try {
      const anthropic = new Anthropic()
      const perfilTexto = [
        `Situación laboral: ${(perfil.situacion || []).join(', ')}`,
        `Edad: ${perfil.nacimiento?.[0] ? new Date().getFullYear() - new Date(perfil.nacimiento[0]).getFullYear() + ' anos' : 'nd'}`,
        `Género: ${perfil.genero?.[0] || 'nd'}`,
        `Situación familiar: ${(perfil.familia || []).join(', ') || 'nd'}`,
        `Ingresos: ${perfil.ingresos?.[0] || 'nd'}`,
        `CCAA: ${perfil.ccaa?.[0] || 'nd'} | Provincia: ${perfil.provincia?.[0] || 'nd'} | Municipio: ${(() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || 'nd' } catch { return 'nd' } })()}`,
        `Situaciones especiales: ${(perfil.especial || []).join(', ') || 'ninguna'}`,
      ].join('\n')

      const lista = conScore.slice(0, 40).map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.comunidad_autonoma || 'Estatal'}`).join('\n')

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: `Eres un experto en ayudas públicas españolas. Revisa esta lista con sentido común y devuelve solo las ayudas que genuinamente le corresponden a esta persona.

PERFIL:
${perfilTexto}

AYUDAS:
${lista}

Excluye las que claramente no aplican: porque van a otra persona específica (nombre propio), porque requieren una situación que esta persona no tiene, porque son de otra zona geográfica, o por cualquier razón de sentido común.

Devuelve SOLO este JSON:
{"ids": ["id1", "id2", ...]}` }],
      })
      const texto = msg.content.find(b => b.type === 'text')?.text || ''
      const match = texto.match(/\{[\s\S]*\}/)
      if (match) {
        const { ids } = JSON.parse(match[0])
        if (Array.isArray(ids) && ids.length > 0) {
          const mapa = Object.fromEntries(conScore.map(a => [a.id, a]))
          const filtradas = ids.map(id => mapa[id]).filter(Boolean)
          if (filtradas.length > 0) ayudasFinal = filtradas
        }
      }
    } catch (ef) {
      console.error('filtro IA error:', ef.message)
    }

    // Guardar en caché solo el resultado filtrado
    if (userId && ayudasFinal.length > 0) {
      try {
        await supabaseAdmin.from('usuarios').update({ ayudas_calculadas: ayudasFinal.map(a => a.id) }).eq('id', userId)
      } catch {}
    }

    return res.json({ ok: true, ayudas: ayudasFinal })
  } catch (e) {
    console.error('Error calcular-ayudas:', e)
    return res.status(500).json({ error: e.message })
  }
}
