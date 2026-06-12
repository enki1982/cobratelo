import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['sb-access-token']
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Sesión inválida' })

  const { perfil, ayudas } = req.body
  if (!perfil || !ayudas?.length) return res.json({ ids: [] })

  const LABEL_LAB = { empleado:'Empleado/a por cuenta ajena', autonomo:'Autónomo/a', desempleado:'En paro', pensionista:'Pensionista/Jubilado', estudiante:'Estudiante', emprendedor:'Quiere emprender' }
  const LABEL_ING = { bajo:'Menos de 8.000€/año', medio_bajo:'8.000–15.000€/año', medios:'15.000–30.000€/año', alto:'Más de 30.000€/año' }

  const nacimiento  = perfil.nacimiento?.[0]
  const edad        = nacimiento ? new Date().getFullYear() - new Date(nacimiento).getFullYear() : null
  const laboral     = (perfil.situacion || []).map(s => LABEL_LAB[s] || s).join(', ')
  const ingresos    = LABEL_ING[perfil.ingresos?.[0]] || '—'
  const familia     = perfil.familia?.[0] || '—'
  const ccaa        = perfil.ccaa?.[0] || '—'
  const provincia   = perfil.provincia?.[0] || ccaa
  const comarca     = perfil.comarca?.[0] || provincia
  const pueblo      = (() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || '—' } catch { return '—' } })()
  const genero      = perfil.genero?.[0] || 'nd'
  const especial    = (perfil.especial || []).join(', ') || 'ninguna'

  const esPensionista    = (perfil.situacion || []).includes('pensionista')
  const esAutonomo       = (perfil.situacion || []).includes('autonomo')
  const esDesempleado    = (perfil.situacion || []).includes('desempleado')
  const esEstudiante     = (perfil.situacion || []).includes('estudiante')
  const tieneHijos       = (perfil.familia || []).some(f => f && (f.includes('hijo') || f.includes('menor')))
  const tieneDependiente = (perfil.familia || []).includes('dependiente_cargo') || (perfil.especial || []).includes('dependencia')
  const esViudo          = (perfil.familia || []).includes('viudo')

  const perfilResumen = [
    `Situación laboral: ${laboral}`,
    `Edad: ${edad ? edad + ' años' : 'desconocida'}`,
    `Género: ${genero}`,
    `Ingresos: ${ingresos}`,
    `Situación familiar: ${familia}`,
    `Localidad: ${pueblo}, ${provincia}, ${ccaa}`,
    `Situaciones especiales: ${especial}`,
    `Extras: ${(perfil.extras || []).join(', ') || 'ninguno'}`,
    `ES pensionista/jubilado: ${esPensionista ? 'SÍ' : 'NO'}`,
    `ES autónomo: ${esAutonomo ? 'SÍ' : 'NO'}`,
    `TIENE hijos/menores a cargo: ${tieneHijos ? 'SÍ' : 'NO'}`,
    `TIENE dependiente a cargo: ${tieneDependiente ? 'SÍ' : 'NO'}`,
    `ES viudo/a: ${esViudo ? 'SÍ' : 'NO'}`,
  ].join('\n')

  const listaAyudas = ayudas.slice(0, 40).map(a => ({
    id: a.id,
    nombre: a.nombre,
    organismo: a.organismo,
    ccaa: a.comunidad_autonoma,
  }))

  const prompt = `Eres un experto en ayudas públicas españolas. Aplica SENTIDO COMÚN al perfil del usuario y devuelve solo las ayudas que realmente le corresponden.

PERFIL DEL USUARIO:
${perfilResumen}

LOCALIZACIÓN: ${pueblo}, comarca ${comarca}, provincia ${provincia}, ${ccaa}

AYUDAS A ANALIZAR:
${listaAyudas.map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.ccaa || 'Estatal'}`).join('\n')}

EXCLUIR si se cumple CUALQUIERA de estas condiciones:

1. NOMINATIVA — el nombre de la ayuda contiene un nombre propio de persona física (ej: "David Martínez", "María García") o va para una asociación/entidad nombrada específicamente que no es el usuario.

2. GEOGRÁFICA — el nombre u organismo menciona un municipio, comarca, ayuntamiento o diputación de zona distinta a ${pueblo} / ${comarca} / ${provincia}. MANTENER: estatales, de ${ccaa} en general, provinciales de ${provincia}.

3. LABORAL — es solo para autónomos y el usuario NO es autónomo (${esAutonomo ? 'ES autónomo' : 'NO es autónomo'}). Es para empresas/pymes. Es beca universitaria y el usuario no estudia.

4. PENSIONISTA — el usuario ${esPensionista ? 'YA ES pensionista' : 'no es pensionista'}. Si YA ES pensionista: excluir ayudas para solicitar/tramitar jubilación o pensión (ya la tiene), excluir inserción laboral, excluir prestaciones por desempleo.

5. ORFANDAD — pensiones/prestaciones de orfandad son para los HIJOS del fallecido, NO para el cónyuge superviviente. Si el usuario es viudo/a, la orfandad no le corresponde a él/ella.

6. CUIDADORES/DEPENDENCIA — ayudas para cuidadores de dependientes solo si el usuario TIENE dependiente a cargo. Este usuario ${tieneDependiente ? 'SÍ tiene' : 'NO tiene'} dependiente a cargo.

7. HIJOS/MENORES — ayudas exclusivas para familias con hijos o menores solo si el usuario TIENE hijos. Este usuario ${tieneHijos ? 'SÍ tiene' : 'NO tiene'} hijos/menores a cargo.

8. EDAD — excluir ayudas exclusivamente para jóvenes (menores de 35) si el usuario tiene ${edad} años.

MANTENER: ayudas de vivienda generales, complementos de pensión, prestaciones de viudedad, ayudas autonómicas/estatales sin restricción que contradiga el perfil.

Devuelve SOLO este JSON sin texto adicional:
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

    const { ids } = JSON.parse(match[0])
    return res.json({ ids: Array.isArray(ids) ? ids : [] })
  } catch (e) {
    console.error('filtrar-ayudas error:', e)
    return res.json({ ids: ayudas.slice(0, 20).map(a => a.id) })
  }
}
