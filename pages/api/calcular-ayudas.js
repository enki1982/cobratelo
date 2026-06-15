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
    // ── DEDUPLICACIÓN server-side ──────────────────────────────────
    const normKey = s => {
      let n = (s||'').toLowerCase()
        .replace(/tu\+1/gi,'tuplus1').replace(/industria\s*4\.0/gi,'industria40')
      n = n.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/20\d\d/g,'').replace(/[^a-z0-9\s]/g,' ')
        .replace(/\b(programa|plan|convocatoria|subvenciones?|digitaliz\w*|ayudas?|pymes?|autonomos?|empresas?|catalun\w*|para|del?|las?|los?|una?|por|en|y|e|nuevos?|cuota|reducida|impulso|incentivo|contratacion)\b/gi,'')
        .replace(/\s+/g,' ').trim()
      return n.split(' ').filter(w=>w.length>=3).slice(0,2).join(' ')
    }

    const deduped = new Map()
    const conScoreDedup = conScore.filter(a => {
      const k = normKey(a.nombre)
      if (!k) return true
      if (!deduped.has(k)) { deduped.set(k, a._score); return true }
      if (a._score > deduped.get(k)) { deduped.set(k, a._score); return true }
      return false
    })

    // Filtro de sentido común en el servidor (sin depender de sesión del cliente)
    let ayudasFinal = conScoreDedup.slice(0, 20)
    try {
      const anthropic = new Anthropic()
      const _sit = perfil.situacion || []
      const _fam = perfil.familia || []
      const _esp = perfil.especial || []
      const _edad = perfil.nacimiento?.[0] ? new Date().getFullYear() - new Date(perfil.nacimiento[0]).getFullYear() : null
      const _muni = (() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || 'nd' } catch { return 'nd' } })()
      const LABEL_SIT = {empleado:'empleado por cuenta ajena',autonomo:'autonomo',desempleado:'desempleado/en paro',pensionista:'pensionista/jubilado',estudiante:'estudiante',emprendedor:'quiere emprender'}
      const LABEL_FAM = {soltero:'soltero/a SIN hijos',pareja:'en pareja SIN hijos',divorciado:'divorciado/a SIN hijos',hijos_menores:'con hijos menores a cargo',hijos_mayores:'con hijos mayores de edad',monoparental:'familia monoparental con hijos',viudo:'viudo/a',dependiente_cargo:'tiene dependiente a cargo'}
      const perfilTexto = [
        'Situacion laboral: ' + _sit.map(s => LABEL_SIT[s] || s).join(', '),
        'Edad: ' + (_edad ? _edad + ' anos' : 'nd'),
        'Genero: ' + (perfil.genero?.[0] || 'nd'),
        'Situacion familiar: ' + (_fam.map(f => LABEL_FAM[f] || f).join(', ') || 'nd'),
        'Tiene hijos: ' + (_fam.some(f => f.includes('hijo') || f === 'monoparental') ? 'SI' : 'NO'),
        'Tiene dependiente a cargo: ' + (_fam.includes('dependiente_cargo') || _esp.includes('dependencia') ? 'SI' : 'NO'),
        'ES autonomo: ' + (_sit.includes('autonomo') ? 'SI' : 'NO'),
        'ES pensionista: ' + (_sit.includes('pensionista') ? 'SI' : 'NO'),
        'ES desempleado: ' + (_sit.includes('desempleado') ? 'SI' : 'NO'),
        'Ingresos: ' + (perfil.ingresos?.[0] || 'nd'),
        'Municipio: ' + _muni + ' | Provincia: ' + (perfil.provincia?.[0] || 'nd') + ' | CCAA: ' + (perfil.ccaa?.[0] || 'nd'),
        'Especial: ' + (_esp.join(', ') || 'ninguna'),
      ].join('\n')

      const lista = conScoreDedup.slice(0, 40).map(a => `[${a.id}] ${a.nombre} | ${a.organismo} | ${a.comunidad_autonoma || 'Estatal'}${a.descripcion ? ' | ' + a.descripcion.substring(0,120) : ''}`).join('\n')

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0,
        messages: [{ role: 'user', content: `Eres un asesor experto en ayudas públicas españolas. Tienes el perfil de una persona y una lista de ayudas pre-seleccionadas. Quédate SOLO con las que realmente le corresponden, aplicando sentido común estricto.

PERFIL DE LA PERSONA:
${perfilTexto}

AYUDAS A REVISAR:
${lista}

REGLAS (aplícalas con rigor):
- Si la persona NO es autónomo ni tiene empresa, EXCLUYE toda ayuda para autónomos, pymes, empresas, contratación de trabajadores, digitalización empresarial, movilidad de empresa o emprendimiento.
- Si NO tiene hijos ni menores a cargo, EXCLUYE ayudas para familias con hijos, infancia, maternidad o paternidad.
- Si tiene ingresos medios o altos, EXCLUYE ayudas de emergencia social, exclusión residencial, renta mínima, ingreso mínimo vital o renta garantizada (son solo para ingresos muy bajos).
- Si es pensionista/jubilada, EXCLUYE inserción laboral, empleo y emprendimiento.
- EXCLUYE ayudas de otra zona geográfica distinta a donde vive.
- EXCLUYE ayudas nominativas (a una persona o entidad con nombre propio).

Para cada ayuda que SÍ corresponde, añade una razón breve (máximo 12 palabras) explicando por qué encaja con ESTA persona (su situación, edad, zona o condición), escrita en segunda persona ("Te corresponde por ser autónomo", "Al residir en Cataluña", etc).

Devuelve SOLO este JSON:
{"ayudas": [{"id": "id1", "razon": "..."}, {"id": "id2", "razon": "..."}]}` }],
      })
      const texto = msg.content.find(b => b.type === 'text')?.text || ''
      const match = texto.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const items = Array.isArray(parsed.ayudas) ? parsed.ayudas : (Array.isArray(parsed.ids) ? parsed.ids.map(id => ({ id, razon: null })) : [])
        if (items.length > 0) {
          const mapa = Object.fromEntries(conScoreDedup.map(a => [a.id, a]))
          const filtradas = items.map(it => {
            const ayuda = mapa[it.id]
            if (!ayuda) return null
            return { ...ayuda, razon_match: it.razon || null }
          }).filter(Boolean)
          if (filtradas.length > 0) ayudasFinal = filtradas
        }
      }
    } catch (ef) {
      console.error('filtro IA error:', ef.message)
    }

    // Guardar en caché: IDs + razones de match (para no recalcular)
    if (userId && ayudasFinal.length > 0) {
      try {
        const razonesMap = {}
        ayudasFinal.forEach(a => { if (a.razon_match) razonesMap[a.id] = a.razon_match })
        await supabaseAdmin.from('usuarios').update({
          ayudas_calculadas: ayudasFinal.map(a => a.id),
          ayudas_razones: razonesMap,
        }).eq('id', userId)
      } catch {}
    }

    // Marcar fuente oficial vs no oficial (sello de confianza)
    const ES_OFICIAL = /(\.gob\.es|\.gov\.|gencat\.cat|\.cat\/|\.eus|\.gal|boe\.es|administracion|infosubvenciones|pap\.hacienda|bdns|seg-social|sepe\.es|red\.es|idae|imserso|ajuntament|diputaci|generalitat|juntadeandalucia|comunidad\.madrid|madrid\.es|euskadi|xunta|aragon|larioja|carm\.es|jcyl|jccm|gobiernodecanarias|caib\.es|navarra|asturias|cantabria|villa|consorci|sede\.)/i
    const ayudasConSello = ayudasFinal.map(a => ({
      ...a,
      fuente_oficial: a.url_oficial ? ES_OFICIAL.test(a.url_oficial) : false,
    }))

    return res.json({ ok: true, ayudas: ayudasConSello })
  } catch (e) {
    console.error('Error calcular-ayudas:', e)
    return res.status(500).json({ error: e.message })
  }
}
