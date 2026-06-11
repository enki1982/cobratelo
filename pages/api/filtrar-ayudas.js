import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth: solo usuarios autenticados pueden llamar a Anthropic
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['sb-access-token']
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Sesión inválida' })

  const { perfil, ayudas } = req.body
  if (!perfil || !ayudas?.length) return res.json({ ids: [] })

  const LABEL_LAB = { empleado:'Empleado/a por cuenta ajena', autonomo:'Autónomo/a', desempleado:'En paro', pensionista:'Pensionista/Jubilado', estudiante:'Estudiante', emprendedor:'Quiere emprender' }
  const LABEL_ING = { bajo:'Menos de 8.000€/año', medio_bajo:'8.000–15.000€/año', medios:'15.000–30.000€/año', alto:'Más de 30.000€/año' }

  const nacimiento = perfil.nacimiento?.[0]
  const edad = nacimiento ? new Date().getFullYear() - new Date(nacimiento).getFullYear() : null
  const laboral = (perfil.situacion || []).map(s => LABEL_LAB[s] || s).join(', ')
  const ingresos = LABEL_ING[perfil.ingresos?.[0]] || '—'
  const vivienda = perfil.vivienda?.[0] || '—'
  const familia  = perfil.familia?.[0] || '—'
  const ccaa     = perfil.ccaa?.[0] || '—'
  const provincia = perfil.provincia?.[0] || ccaa
  const comarca  = perfil.comarca?.[0] || provincia
  const pueblo   = (() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || '—' } catch { return '—' } })()
  const genero   = perfil.genero?.[0] || 'nd'
  const especial = (perfil.especial || []).join(', ') || 'ninguna'

  const perfilTexto = `
- Situación laboral: ${laboral}
- Edad: ${edad ? edad + ' años' : 'desconocida'}
- Género: ${genero}
- Ingresos: ${ingresos}
- Vivienda: ${vivienda}
- Situación familiar: ${familia}
- Localidad: ${pueblo}, ${provincia}, ${ccaa}
- Situaciones especiales: ${especial}
- Extras: ${(perfil.extras || []).join(', ') || 'ninguno'}`

  const listaAyudas = ayudas.slice(0, 40).map(a => ({
    id: a.id,
    nombre: a.nombre,
    organismo: a.organismo,
    ambito: a.ambito,
    ccaa: a.comunidad_autonoma,
    tipo: a.tipo,
  }))

  const prompt = `Eres un experto en ayudas públicas españolas. Filtra estas ayudas para el usuario.

PERFIL:
${perfilTexto}

LOCALIZACIÓN EXACTA DEL USUARIO:
- Municipio: ${pueblo}
- Comarca: ${comarca}
- Provincia: ${provincia}
- CCAA: ${ccaa}

AYUDAS A ANALIZAR:
${listaAyudas.map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.ccaa || 'Estatal'}`).join('\n')}

REGLAS DE EXCLUSIÓN (sé estricto):

1. GEOGRÁFICAS — EXCLUIR si la ayuda menciona explícitamente una comarca, municipio o entidad local DISTINTA a donde vive el usuario.
   El usuario vive en: municipio ${pueblo}, comarca ${comarca}, provincia ${provincia}.
   Por tanto EXCLUIR ayudas cuyo nombre u organismo mencione comarcas distintas (ej: si comarca usuario es "Vallès Oriental", excluir Gironès, Barcelonès, Maresme, Baix Llobregat, Osona, etc.).
   MANTENER: ayudas estatales, de ${ccaa} en general, provinciales de ${provincia}, o que no especifiquen área geográfica concreta.

2. LABORALES — EXCLUIR si:
   - La ayuda es EXCLUSIVA para autónomos o freelance y el usuario NO es autónomo
   - La ayuda es para que empresas/autónomos contraten trabajadores (el usuario no tiene empresa)
   - Es una beca universitaria o de movilidad estudiantil y el usuario no es estudiante
   - Es exclusivamente para empresas, pymes o entidades (el usuario es persona física)
   MANTENER: ayudas para empleados, vivienda, familia, subsidios, bonificaciones individuales.

Devuelve SOLO este JSON sin ningún texto adicional antes ni después:
{"ids": ["id1", "id2", "id3", ...]}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content.find(b => b.type === 'text')?.text || ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })

    const { ids } = JSON.parse(match[0])
    return res.json({ ids: Array.isArray(ids) ? ids : [] })
  } catch (e) {
    console.error('filtrar-ayudas error:', e)
    return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })
  }
}
