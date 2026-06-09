import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { perfil, ayudas } = req.body
  if (!perfil || !ayudas?.length) return res.json({ ids: [] })

  // Construir descripción del perfil
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

  // Lista de ayudas para analizar
  const listaAyudas = ayudas.slice(0, 40).map(a => ({
    id: a.id,
    nombre: a.nombre,
    organismo: a.organismo,
    ambito: a.ambito,
    ccaa: a.comunidad_autonoma,
    tipo: a.tipo,
    estado: a.estado,
  }))

  const prompt = `Eres un experto en ayudas públicas españolas. Dado un perfil de usuario y una lista de ayudas potenciales, debes filtrar y ordenar las que realmente le corresponden.

PERFIL DEL USUARIO:
${perfilTexto}

LISTA DE AYUDAS (${listaAyudas.length} candidatas):
${listaAyudas.map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.ccaa || 'Estatal'} | ${a.tipo}`).join('\n')}

INSTRUCCIONES:
1. EXCLUIR ayudas que claramente NO aplican al perfil:
   - Ayudas de autónomos/emprendedores si el usuario SOLO es empleado
   - Becas universitarias si no es estudiante
   - Ayudas específicas de otra CCAA/provincia diferente a la del usuario
   - Ayudas para mujeres si el usuario es hombre (o viceversa si está claro)
   - Ayudas para empresas/pymes si el usuario no tiene empresa
   - Ayudas para mayores de 65 si el usuario es joven
2. MANTENER ayudas estatales (aplican a todos), autonómicas de su CCAA, y cualquier duda resuelta a favor del usuario
3. ORDENAR por relevancia real: primero las más directamente aplicables

Responde ÚNICAMENTE con JSON válido, sin explicaciones:
{"ids": ["id1", "id2", "id3", ...]}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content.find(b => b.type === 'text')?.text || ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })

    const { ids } = JSON.parse(match[0])
    return res.json({ ids: Array.isArray(ids) ? ids : [] })
  } catch (e) {
    console.error('filtrar-ayudas error:', e)
    // Fallback: devolver sin filtrar
    return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })
  }
}
