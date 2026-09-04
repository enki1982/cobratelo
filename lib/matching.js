// lib/matching.js — Motor de matching por EXCLUSIÓN (no por scoring).
//
// Filosofía (decidida con el cliente):
//   - El sistema NO puntúa ni decide "relevancia": eso lo decide el usuario/gestor.
//   - El sistema solo DESCARTA lo que con certeza NO le corresponde al usuario
//     (otra zona, situación incompatible, edad/renta fuera si el dato existe).
//   - Todo lo que no se puede descartar con seguridad, SE MUESTRA.
//   - Una capa de IA posterior (fuera de este módulo) hace de red de seguridad
//     final para cazar tonterías que se hayan colado.
//
// Se apoya en los metadatos limpios del enricher: entidades_geo, tipo_beneficiario,
// renta_max, edad_min/max, es_nominativa.
//
// La función principal `evaluar(ayuda, perfil)` devuelve:
//   { corresponde: bool, motivo: string|null }
// motivo != null explica POR QUÉ se descartó (para depurar y para logs).

const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

// Mapa de provincia/municipio conocido → CCAA, para detectar cuando una ayuda
// local es de una CCAA distinta a la del usuario aunque no declare comunidad_autonoma.
const PROV_CCAA = {
  'madrid':'madrid',
  'barcelona':'cataluna','girona':'cataluna','gerona':'cataluna','lleida':'cataluna','lerida':'cataluna','tarragona':'cataluna',
  'sevilla':'andalucia','malaga':'andalucia','cadiz':'andalucia','granada':'andalucia','cordoba':'andalucia','huelva':'andalucia','jaen':'andalucia','almeria':'andalucia',
  'valencia':'valenciana','alicante':'valenciana','castellon':'valenciana',
  'a coruna':'galicia','coruna':'galicia','lugo':'galicia','ourense':'galicia','orense':'galicia','pontevedra':'galicia',
  'vizcaya':'pais vasco','bizkaia':'pais vasco','guipuzcoa':'pais vasco','gipuzkoa':'pais vasco','alava':'pais vasco','araba':'pais vasco',
  'zaragoza':'aragon','huesca':'aragon','teruel':'aragon',
  'asturias':'asturias','cantabria':'cantabria','murcia':'murcia','navarra':'navarra','nafarroa':'navarra',
  'baleares':'baleares','illes balears':'baleares','mallorca':'baleares','menorca':'baleares','ibiza':'baleares',
  'las palmas':'canarias','santa cruz de tenerife':'canarias','tenerife':'canarias','gran canaria':'canarias',
  'badajoz':'extremadura','caceres':'extremadura',
  'toledo':'castilla-la mancha','ciudad real':'castilla-la mancha','albacete':'castilla-la mancha','cuenca':'castilla-la mancha','guadalajara':'castilla-la mancha',
  'valladolid':'castilla y leon','leon':'castilla y leon','burgos':'castilla y leon','salamanca':'castilla y leon','zamora':'castilla y leon','palencia':'castilla y leon','avila':'castilla y leon','segovia':'castilla y leon','soria':'castilla y leon',
  'la rioja':'la rioja','rioja':'la rioja',
}

function ccaaDeLugar(lugar) {
  const l = norm(lugar)
  for (const [prov, ccaa] of Object.entries(PROV_CCAA)) {
    if (l.includes(prov)) return ccaa
  }
  return null
}

// Beneficiarios que NO son un ciudadano particular. Si la ayuda es EXCLUSIVAMENTE
// para estos, un usuario persona física queda descartado.
const NO_CIUDADANO = ['entidad_publica', 'ong', 'empresa']

// Mapa: situación del usuario → tipos de beneficiario compatibles de la ayuda.
const SITUACION_COMPAT = {
  empleado:    ['empleado', 'persona_fisica', 'cualquiera'],
  autonomo:    ['autonomo', 'empresa', 'persona_fisica', 'cualquiera'],
  desempleado: ['desempleado', 'persona_fisica', 'cualquiera'],
  pensionista: ['pensionista', 'persona_fisica', 'cualquiera'],
  estudiante:  ['estudiante', 'persona_fisica', 'cualquiera'],
  emprendedor: ['autonomo', 'empresa', 'persona_fisica', 'cualquiera'],
}

/**
 * Evalúa si una ayuda le corresponde a un perfil.
 * @returns {{corresponde: boolean, motivo: string|null}}
 */
export function evaluar(ayuda, perfil) {
  // ── Datos del usuario ──
  const situaciones = (perfil.situacion || []).map(norm)
  const puebloObj = (() => { try { return JSON.parse((perfil.pueblo || ['{}'])[0]) } catch { return {} } })()
  const ccaaU = norm((perfil.ccaa || [])[0] || puebloObj.ccaa || '')
  const provinciaU = norm((perfil.provincia || [])[0] || puebloObj.provincia || '')
  const puebloU = norm(puebloObj.nombre || '')
  const zonasU = [puebloU, provinciaU, ccaaU].filter(z => z && z.length >= 3)

  const nacimiento = (perfil.nacimiento || [])[0] || ''
  const edad = nacimiento ? (new Date().getFullYear() - new Date(nacimiento).getFullYear()) : null

  const INGRESOS_APROX = {
    bajo: 6000, bajos: 6000,
    medio_bajo: 11000, medios_bajos: 11000,
    medios: 22000, medio: 22000,
    alto: 40000, altos: 40000,
  }
  const rentaU = INGRESOS_APROX[(perfil.ingresos || [])[0]] || null

  // ══════════════════════════════════════════════════════════════
  // DESCARTES (en cuanto uno se cumple, la ayuda NO corresponde)
  // ══════════════════════════════════════════════════════════════

  // 1. Nominativa → nunca solicitable
  if (ayuda.es_nominativa === true || ayuda.es_nominativa === 'true' || ayuda.es_nominativa === 1) {
    return { corresponde: false, motivo: 'nominativa (no solicitable)' }
  }

  // 2. GEOGRAFÍA
  //    Solo descarta si podemos CONFIRMAR que es de otra zona. Ante la duda, pasa.
  const ambito = norm(ayuda.ambito)
  if (ambito !== 'estatal') {
    const ccaaAyuda = norm(ayuda.comunidad_autonoma)
    // 2a. CCAA declarada distinta → fuera
    if (ccaaAyuda && ccaaAyuda !== 'estatal' && ccaaU && ccaaAyuda !== ccaaU) {
      return { corresponde: false, motivo: `otra CCAA (${ayuda.comunidad_autonoma})` }
    }
    // 2b. entidades_geo (municipios/provincias concretas). Si la ayuda está atada a
    //     lugares concretos y NINGUNO coincide con la zona del usuario → fuera.
    //     (Una ayuda local de "Quart de Poblet" no le corresponde a alguien de Madrid.)
    if (Array.isArray(ayuda.entidades_geo) && ayuda.entidades_geo.length > 0 && zonasU.length > 0) {
      const geoNorm = ayuda.entidades_geo.map(norm).filter(g => g.length >= 3)
      if (geoNorm.length > 0) {
        const coincide = geoNorm.some(g => zonasU.some(z => g.includes(z) || z.includes(g)))
        if (!coincide) {
          return { corresponde: false, motivo: `otra zona (${ayuda.entidades_geo.join(', ')})` }
        }
      }
    }
  }

  // 3. TIPO DE BENEFICIARIO
  if (Array.isArray(ayuda.tipo_beneficiario) && ayuda.tipo_beneficiario.length > 0) {
    const benef = ayuda.tipo_beneficiario.map(norm)
    // 3a. Ayuda SOLO para no-ciudadanos (entidad pública, ONG, empresa) y el usuario
    //     es una persona física sin actividad → fuera.
    const soloNoCiudadano = benef.every(b => NO_CIUDADANO.includes(b))
    const usuarioEsEmpresa = situaciones.includes('autonomo') || situaciones.includes('emprendedor')
    if (soloNoCiudadano && !(usuarioEsEmpresa && benef.includes('empresa'))) {
      return { corresponde: false, motivo: `solo para ${benef.join('/')}` }
    }
    // 3b. La ayuda va a colectivos concretos y NINGUNO es compatible con la situación
    //     del usuario. Solo descarta si la ayuda NO admite 'cualquiera'/'persona_fisica'.
    const admiteTodos = benef.includes('cualquiera') || benef.includes('persona_fisica')
    if (!admiteTodos && situaciones.length > 0) {
      const compatibles = situaciones.flatMap(s => SITUACION_COMPAT[s] || [])
      const hayEncaje = benef.some(b => compatibles.includes(b))
      if (!hayEncaje) {
        return { corresponde: false, motivo: `para ${benef.join('/')}, no encaja con ${situaciones.join('/')}` }
      }
    }
  }

  // 4. EDAD — solo si el usuario dio su edad Y la ayuda tiene rango
  if (edad !== null) {
    if (ayuda.edad_min && edad < ayuda.edad_min) {
      return { corresponde: false, motivo: `edad mínima ${ayuda.edad_min} (tiene ${edad})` }
    }
    if (ayuda.edad_max && edad > ayuda.edad_max) {
      return { corresponde: false, motivo: `edad máxima ${ayuda.edad_max} (tiene ${edad})` }
    }
  }

  // 5. RENTA — solo si el usuario indicó ingresos Y la ayuda tiene tope
  if (rentaU !== null && ayuda.renta_max) {
    if (rentaU > ayuda.renta_max * 1.15) {  // 15% de margen por aproximación
      return { corresponde: false, motivo: `renta máx ${ayuda.renta_max} (aprox ${rentaU})` }
    }
  }

  // ── No se pudo descartar → SE MUESTRA (el usuario decide) ──
  return { corresponde: true, motivo: null }
}

// Compatibilidad: función que devuelve solo el booleano (para filter directo)
export function corresponde(ayuda, perfil) {
  return evaluar(ayuda, perfil).corresponde
}
