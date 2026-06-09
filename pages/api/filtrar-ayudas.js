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

  const ubicacion = `${pueblo} (comarca: ${comarca}, provincia: ${provincia}, CCAA: ${ccaa})`

  const prompt = `Eres un experto en ayudas públicas españolas. Dado un perfil de usuario y una lista de ayudas potenciales, filtra y ordena las que realmente le corresponden.

PERFIL DEL USUARIO:
${perfilTexto}

UBICACIÓN EXACTA DEL USUARIO: ${ubicacion}

LISTA DE AYUDAS (${listaAyudas.length} candidatas):
${listaAyudas.map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.ccaa || 'Estatal'} | ${a.tipo}`).join('\n')}

REGLAS DE FILTRADO (aplica con criterio estricto):
1. EXCLUIR si el nombre u organismo menciona una comarca, municipio o provincia DIFERENTE a la del usuario:
   - Usuario en ${comarca} → excluir ayudas de otras comarcas catalanas (Gironès, Maresme, Vallès, etc.)
   - Usuario en ${provincia} → excluir ayudas de otras provincias
2. EXCLUIR si la situación laboral no coincide:
   - Ayudas de/para autónomos o empresas → excluir si el usuario es solo empleado por cuenta ajena
   - Ayudas para contratación (el usuario contrataría a alguien) → excluir si no tiene empresa
   - Becas universitarias o de movilidad estudiantil → excluir si no es estudiante
3. EXCLUIR ayudas para empresas, pymes o entidades → el usuario es persona física
4. MANTENER: ayudas estatales, autonómicas de ${ccaa}, y cualquier caso de duda → a favor del usuario
5. ORDENAR por relevancia directa al perfil concreto

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
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
