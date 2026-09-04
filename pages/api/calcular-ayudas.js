import Anthropic from '@anthropic-ai/sdk'
import { logAccess, ACTIONS } from '../../lib/access-log'
import { createClient } from '@supabase/supabase-js'
import { corresponde } from '../../lib/matching'

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
    // Fetch solo ayudas ACTIVAS y VIGENTES (verificadas: activa=true + fecha_fin real futura)
    const hoyISO = new Date().toISOString().slice(0, 10)
    const { data: ayudas } = await supabaseAdmin
      .from('ayudas')
      .select('id,nombre,descripcion,palabras_clave,organismo,ambito,comunidad_autonoma,slug,tipo,estado,importe_min,importe_max,importe_descripcion,url_oficial,fecha_fin,created_at,es_nominativa,entidades_geo,tipo_beneficiario,sectores,renta_max,edad_min,edad_max')
      .eq('activa', true)
      .gte('fecha_fin', hoyISO)

    // Matching por EXCLUSIÓN (no scoring): mostrar todo lo que no se pueda descartar.
    // La relevancia la decide el usuario; el sistema solo quita lo que NO le corresponde.
    const corresponden = (ayudas || [])
      .filter(a => corresponde(a, perfil))

    // Guardar IDs en Supabase para cache
    await supabaseAdmin
      .from('usuarios')
      .update({ ayudas_calculadas: corresponden.map(a => a.id) })
      .eq('id', userId)

    // Funnel events
    try {
      await logAccess(req, { ciudadanoId: userId, action: ACTIONS.QUESTIONNAIRE_COMPLETED, metadata: { total: corresponden.length } })
      if (corresponden.length > 0) await logAccess(req, { ciudadanoId: userId, action: ACTIONS.MATCH_FOUND, metadata: { matches: corresponden.length } })
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
    const conScoreDedup = corresponden.filter(a => {
      const k = normKey(a.nombre)
      if (!k) return true
      if (!deduped.has(k)) { deduped.set(k, true); return true }
      return false
    })

    // Filtro de sentido común en el servidor (sin depender de sesión del cliente)
    let ayudasFinal = conScoreDedup.slice(0, 100)
    try {
      const anthropic = new Anthropic()
      const _sit = perfil.situacion || []
      const _fam = perfil.familia || []
      const _esp = perfil.especial || []
      const _edad = perfil.nacimiento?.[0] ? new Date().getFullYear() - new Date(perfil.nacimiento[0]).getFullYear() : null
      const _muni = (() => { try { const p = perfil.pueblo?.[0]; return typeof p === 'string' ? JSON.parse(p)?.nombre || p : p?.nombre || 'nd' } catch { return 'nd' } })()
      const LABEL_SIT = {empleado:'empleado por cuenta ajena',autonomo:'autonomo',desempleado:'desempleado/en paro',pensionista:'pensionista/jubilado',estudiante:'estudiante',emprendedor:'quiere emprender'}
      const LABEL_FAM = {soltero:'soltero/a SIN hijos',pareja:'en pareja SIN hijos',divorciado:'divorciado/a SIN hijos',hijos_menores:'con hijos menores a cargo',hijos_mayores:'con hijos mayores de edad',monoparental:'familia monoparental con hijos',viudo:'viudo/a',dependiente_cargo:'tiene dependiente a cargo'}
      const LABEL_SECTOR = {sector_comercio:'comercio y venta minorista',sector_hosteleria:'hosteleria y restauracion',sector_servicios:'servicios profesionales y consultoria',sector_tecnologia:'tecnologia, software o digital',sector_construccion:'construccion, reformas e instalacion',sector_industria:'industria y fabricacion',sector_transporte:'transporte y logistica',sector_agricultura:'agricultura, ganaderia o pesca',sector_salud:'salud, bienestar y cuidados',sector_creativo:'creativo, arte y comunicacion',sector_educacion:'educacion y formacion',sector_otro:'otro sector'}
      const LABEL_EMPLEADOS = {empleados_0:'trabaja solo, SIN empleados',empleados_1_2:'1-2 empleados',empleados_3_9:'3-9 empleados',empleados_10_49:'10-49 empleados',empleados_50mas:'50 o mas empleados'}
      const LABEL_ANTIG = {antiguedad_nuevo:'aun no dado de alta (nuevo autonomo)',antiguedad_menos1:'menos de 1 ano de alta',antiguedad_1_3:'entre 1 y 3 anos de alta',antiguedad_mas3:'mas de 3 anos de alta (autonomo veterano)'}
      const _esAutonomo = _sit.includes('autonomo') || _sit.includes('emprendedor')
      const _sector = perfil.autonomo_sector?.[0]
      const _empleados = perfil.autonomo_empleados?.[0]
      const _antiguedad = perfil.autonomo_antiguedad?.[0]
      const perfilTexto = [
        'Situacion laboral: ' + _sit.map(s => LABEL_SIT[s] || s).join(', '),
        'Edad: ' + (_edad ? _edad + ' anos' : 'nd'),
        'Genero: ' + (perfil.genero?.[0] || 'nd'),
        'Situacion familiar: ' + (_fam.map(f => LABEL_FAM[f] || f).join(', ') || 'nd'),
        'Tiene hijos: ' + (_fam.some(f => f.includes('hijo') || f === 'monoparental') ? 'SI' : 'NO'),
        'Tiene dependiente a cargo: ' + (_fam.includes('dependiente_cargo') || _esp.includes('dependencia') ? 'SI' : 'NO'),
        'ES autonomo: ' + (_sit.includes('autonomo') ? 'SI' : 'NO'),
        'ES pensionista: ' + (_sit.includes('pensionista') ? 'SI' : 'NO'),
        ...((_fam.includes('viudo') && (perfil.viudedad_pension?.[0] === 'viudedad_cobra')) ? ['YA COBRA la pension de viudedad: SI (excluir prestaciones de pension de viudedad, ya las percibe)'] : []),
        'ES desempleado: ' + (_sit.includes('desempleado') ? 'SI' : 'NO'),
        ...(_esAutonomo && _sector ? ['Sector de actividad del autonomo: ' + (LABEL_SECTOR[_sector] || _sector)] : []),
        ...(_esAutonomo && _empleados ? ['Empleados a cargo: ' + (LABEL_EMPLEADOS[_empleados] || _empleados)] : []),
        ...(_esAutonomo && _antiguedad ? ['Antiguedad como autonomo: ' + (LABEL_ANTIG[_antiguedad] || _antiguedad)] : []),
        'Ingresos: ' + (perfil.ingresos?.[0] || 'nd'),
        'Municipio: ' + _muni + ' | Provincia: ' + (perfil.provincia?.[0] || 'nd') + ' | CCAA: ' + (perfil.ccaa?.[0] || 'nd'),
        'Especial: ' + (_esp.join(', ') || 'ninguna'),
      ].join('\n')

      const lista = conScoreDedup.slice(0, 40).map(a => {
        // Geografía honesta para la IA: nunca decir "Estatal" cuando no lo sabemos.
        // Preferir entidades_geo (municipios/provincias concretas del enricher),
        // luego comunidad_autonoma, y si no hay nada, avisar de que NO está confirmada.
        let zona
        if (Array.isArray(a.entidades_geo) && a.entidades_geo.length > 0) {
          zona = 'Zona: ' + a.entidades_geo.join(', ')
        } else if (a.comunidad_autonoma && a.comunidad_autonoma !== 'Estatal') {
          zona = 'CCAA: ' + a.comunidad_autonoma
        } else if (a.ambito === 'estatal') {
          zona = 'Ambito estatal (toda Espana)'
        } else {
          zona = 'ZONA NO CONFIRMADA (verificar en nombre/organismo si es de la zona del usuario)'
        }
        return `[${a.id}] ${a.nombre} | ${a.organismo} | ${zona}${a.descripcion ? ' | ' + a.descripcion.substring(0,120) : ''}`
      }).join('\n')

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
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
- Si la persona YA COBRA la pension de viudedad, EXCLUYE cualquier prestacion o ayuda de pension de viudedad (ya la percibe, no es una ayuda pendiente para ella).
- Si la persona es autónomo y se indica su SECTOR de actividad, EXCLUYE ayudas claramente destinadas a un sector distinto (ej: un autónomo de servicios o tecnología NO debe ver ayudas exclusivas de industria/fabricación, agricultura, pesca, transporte o construcción que no sean su sector).
- Si se indica el numero de EMPLEADOS, EXCLUYE ayudas o tramos para un tamaño de plantilla que no corresponde (ej: si trabaja solo o tiene pocos empleados, EXCLUYE segmentos/programas exigen mas empleados; el Kit Digital Segmento I es para 10-49 empleados, el Segmento II para 3-9, el Segmento III para 0-2).
- Si se indica la ANTIGUEDAD como autónomo, EXCLUYE ayudas exclusivas de nuevos autónomos (como la tarifa plana) cuando la persona lleva mas de 1-2 años dado de alta.
- EXCLUYE ayudas de otra zona geográfica distinta a donde vive. IMPORTANTE sobre la geografía: la persona vive en el municipio/provincia/CCAA indicados en su perfil. Una ayuda AUTONÓMICA o LOCAL solo le corresponde si es de SU zona. Si una ayuda indica "ZONA NO CONFIRMADA", NO la incluyas salvo que su nombre u organismo dejen CLARO que es estatal o de la zona del usuario; ante la duda geográfica, EXCLÚYELA. Nunca incluyas una ayuda de un municipio, provincia o comunidad distintos a los del usuario.
- EXCLUYE ayudas nominativas (a una persona o entidad con nombre propio).

Para cada ayuda que SÍ corresponde, añade una razón breve (máximo 12 palabras) explicando por qué encaja con ESTA persona (su situación, edad, zona o condición), escrita en segunda persona ("Te corresponde por ser autónomo", "Al residir en Cataluña", etc).

Devuelve SOLO este JSON:
{"ayudas": [{"id": "id1", "razon": "..."}, {"id": "id2", "razon": "..."}]}` }],
      })
      const texto = msg.content.find(b => b.type === 'text')?.text || ''
      let items = []
      try {
        const match = texto.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          items = Array.isArray(parsed.ayudas) ? parsed.ayudas : (Array.isArray(parsed.ids) ? parsed.ids.map(id => ({ id, razon: null })) : [])
        }
      } catch (eParse) {
        // JSON truncado o malformado: rescatar pares id+razon individualmente
        const pares = [...texto.matchAll(/"id"\s*:\s*"([^"]+)"\s*,\s*"razon"\s*:\s*"([^"]*)"/g)]
        items = pares.map(m => ({ id: m[1], razon: m[2] }))
        if (items.length === 0) {
          const soloIds = [...texto.matchAll(/"id"\s*:\s*"([^"]+)"/g)]
          items = soloIds.map(m => ({ id: m[1], razon: null }))
        }
        console.error('filtro IA: JSON recuperado de respuesta truncada, items:', items.length)
      }
      {
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
    // URL especifica = lleva a la ficha de la ayuda (numero largo o palabras de detalle). URL generica = home del organismo.
    const ES_ESPECIFICA = /(\/[0-9]{4,}|convocatoria|detalle|ficha|\/id\/|idconvocatoria|expediente|bdns|\?id=)/i
    const ayudasConSello = ayudasFinal.map(a => {
      const tieneUrl = !!(a.url_oficial && a.url_oficial.trim())
      const esEspecifica = tieneUrl && ES_ESPECIFICA.test(a.url_oficial)
      return {
        ...a,
        fuente_oficial: tieneUrl ? ES_OFICIAL.test(a.url_oficial) : false,
        url_es_especifica: esEspecifica,
        // Si la URL es generica o no hay, mostramos datos de localizacion en vez de enlace
        mostrar_datos_fuente: !esEspecifica,
      }
    })

    return res.json({ ok: true, ayudas: ayudasConSello })
  } catch (e) {
    console.error('Error calcular-ayudas:', e)
    return res.status(500).json({ error: e.message })
  }
}
