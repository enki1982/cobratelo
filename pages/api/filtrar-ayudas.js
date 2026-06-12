import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Sin auth — solo recibe texto de perfil + nombres de ayudas, no expone datos personales

  const { perfil, ayudas } = req.body
  if (!perfil || !ayudas?.length) return res.json({ ids: [] })

  const LABEL_LAB = { empleado:'Empleado/a por cuenta ajena', autonomo:'Autónomo/a', desempleado:'En paro', pensionista:'Pensionista/Jubilado', estudiante:'Estudiante', emprendedor:'Quiere emprender' }
  const LABEL_FAM = { soltero:'Soltero/a sin hijos', pareja:'En pareja sin hijos', hijos_menores:'Con hijos menores', hijos_mayores:'Con hijos mayores de edad', monoparental:'Familia monoparental', viudo:'Viudo/a', dependiente_cargo:'Tiene dependiente a cargo' }
  const LABEL_ING = { bajo:'Menos de 8.000€/año', medio_bajo:'8.000–15.000€/año', medios:'15.000–30.000€/año', alto:'Más de 30.000€/año' }

  const nacimiento = perfil.nacimiento?.[0]
  const edad       = nacimiento ? new Date().getFullYear() - new Date(nacimiento).getFullYear() : null
  const pueblo     = (() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || '—' } catch { return '—' } })()
  const provincia  = perfil.provincia?.[0] || perfil.ccaa?.[0] || '—'
  const comarca    = perfil.comarca?.[0] || provincia
  const ccaa       = perfil.ccaa?.[0] || '—'

  const perfilCompleto = [
    `Situación laboral: ${(perfil.situacion || []).map(s => LABEL_LAB[s] || s).join(', ')}`,
    `Edad: ${edad ? edad + ' años' : 'desconocida'}`,
    `Género: ${perfil.genero?.[0] || '—'}`,
    `Ingresos anuales: ${LABEL_ING[perfil.ingresos?.[0]] || '—'}`,
    `Situación familiar: ${(perfil.familia || []).map(f => LABEL_FAM[f] || f).join(', ') || '—'}`,
    `Vivienda: ${perfil.vivienda?.[0] || '—'}`,
    `Situaciones especiales: ${(perfil.especial || []).join(', ') || 'ninguna'}`,
    `Extras: ${(perfil.extras || []).join(', ') || 'ninguno'}`,
    `Municipio: ${pueblo} | Comarca: ${comarca} | Provincia: ${provincia} | CCAA: ${ccaa}`,
  ].join('\n')

  const listaAyudas = ayudas.slice(0, 40)
    .map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.comunidad_autonoma || 'Estatal'}`)
    .join('\n')

  const prompt = `Eres un asesor experto en ayudas públicas españolas. Tienes delante el perfil de una persona real y una lista de ayudas que un sistema automático ha pre-seleccionado para ella.

Tu tarea es revisar la lista con sentido común y quedarte solo con las ayudas que genuinamente le corresponden a esta persona.

PERFIL DE LA PERSONA:
${perfilCompleto}

AYUDAS A REVISAR:
${listaAyudas}

Revisa cada ayuda y descarta las que claramente no aplican a esta persona: porque van dirigidas a otra persona específica, porque requieren una situación familiar o laboral que esta persona no tiene, porque son de una zona geográfica diferente a donde vive, o por cualquier otra razón de sentido común.

Devuelve SOLO este JSON con los IDs de las ayudas que SÍ le corresponden:
{"ids": ["id1", "id2", ...]}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content.find(b => b.type === 'text')?.text || ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })

    const parsed = JSON.parse(match[0])
    console.log('[filtrar-ayudas] input:', ayudas.length, 'ayudas → output:', parsed.ids?.length, 'ids')
    return res.json({ ids: Array.isArray(parsed.ids) ? parsed.ids : [] })
  } catch (e) {
    console.error('[filtrar-ayudas] ERROR:', e.message)
    return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })
  }
}
