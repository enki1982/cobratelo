#!/usr/bin/env node
/**
 * validar_matching.mjs — Valida que el matching no cuela ayudas de otra comunidad.
 *
 * Qué hace:
 *   1. Descarga las ayudas VIGENTES reales de Supabase.
 *   2. Para cada perfil de prueba (usuarios de distintas comunidades),
 *      aplica la lógica real de calcularRelevancia().
 *   3. De las ayudas que PASAN el filtro (score >= 40), comprueba si alguna
 *      es de una comunidad/provincia DISTINTA a la del usuario (el bug de Madrid).
 *   4. Reporta cuántas se cuelan y ejemplos concretos.
 *
 * Uso (en el VPS, dentro de ~/ayuda-es-agent con relevancia.js copiado):
 *   node validar_matching.mjs
 *
 * Requiere: variables SUPABASE_URL y SUPABASE_SERVICE_KEY en el entorno,
 *           y el archivo lib/relevancia.js accesible.
 */

import { calcularRelevancia } from './lib/relevancia.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
const HOY = new Date().toISOString().slice(0, 10)
const UMBRAL = 40  // mismo umbral que calcular-ayudas.js

// ── Mapa provincia → CCAA (para detectar ayudas coladas de otra región) ──
const PROV_A_CCAA = {
  'madrid':'madrid',
  'barcelona':'cataluna','girona':'cataluna','lleida':'cataluna','tarragona':'cataluna',
  'sevilla':'andalucia','malaga':'andalucia','cadiz':'andalucia','granada':'andalucia','cordoba':'andalucia','huelva':'andalucia','jaen':'andalucia','almeria':'andalucia',
  'valencia':'valenciana','alicante':'valenciana','castellon':'valenciana',
  'a coruna':'galicia','lugo':'galicia','ourense':'galicia','pontevedra':'galicia',
  'vizcaya':'pais vasco','bizkaia':'pais vasco','guipuzcoa':'pais vasco','gipuzkoa':'pais vasco','alava':'pais vasco','araba':'pais vasco',
  'zaragoza':'aragon','huesca':'aragon','teruel':'aragon',
  'asturias':'asturias','cantabria':'cantabria','murcia':'murcia','navarra':'navarra',
  'baleares':'baleares','illes balears':'baleares','las palmas':'canarias','santa cruz de tenerife':'canarias',
  'badajoz':'extremadura','caceres':'extremadura',
  'toledo':'castilla-la mancha','ciudad real':'castilla-la mancha','albacete':'castilla-la mancha','cuenca':'castilla-la mancha','guadalajara':'castilla-la mancha',
  'valladolid':'castilla y leon','leon':'castilla y leon','burgos':'castilla y leon','salamanca':'castilla y leon','zamora':'castilla y leon','palencia':'castilla y leon','avila':'castilla y leon','segovia':'castilla y leon','soria':'castilla y leon',
  'la rioja':'la rioja','rioja':'la rioja',
}

const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()

// ── Perfiles de prueba: un usuario "tipo" por comunidad ──
const PERFILES = [
  { etiqueta: 'Madrid (empleado)',      ccaa:'Madrid',              provincia:'Madrid',    pueblo:'Madrid',            situacion:['empleado'] },
  { etiqueta: 'Sevilla (autonomo)',     ccaa:'Andalucía',           provincia:'Sevilla',   pueblo:'Sevilla',           situacion:['autonomo'] },
  { etiqueta: 'Barcelona (empleado)',   ccaa:'Cataluña',            provincia:'Barcelona', pueblo:'Barcelona',         situacion:['empleado'] },
  { etiqueta: 'Valencia (desempleado)', ccaa:'Comunidad Valenciana',provincia:'Valencia',  pueblo:'Valencia',          situacion:['desempleado'] },
  { etiqueta: 'A Coruña (autonomo)',    ccaa:'Galicia',             provincia:'A Coruña',  pueblo:'A Coruña',          situacion:['autonomo'] },
  { etiqueta: 'Bilbao (empleado)',      ccaa:'País Vasco',          provincia:'Vizcaya',   pueblo:'Bilbao',            situacion:['empleado'] },
]

function perfilObj(p) {
  return {
    situacion: p.situacion,
    ccaa: [p.ccaa],
    provincia: [p.provincia],
    pueblo: [JSON.stringify({ nombre:p.pueblo, provincia:p.provincia, ccaa:p.ccaa })],
    // sin edad ni ingresos, como el caso de la demo
  }
}

// ¿La ayuda es de una comunidad DISTINTA a la del usuario? (heurística de auditoría)
function esDeOtraComunidad(ayuda, ccaaUsuario) {
  const cu = norm(ccaaUsuario)
  // 1. Por comunidad_autonoma declarada
  const ca = norm(ayuda.comunidad_autonoma)
  if (ca && ca !== 'estatal' && ca !== cu) return { motivo:`ccaa declarada: ${ayuda.comunidad_autonoma}`, si:true }
  // 2. Por entidades_geo (municipios) → mapear a CCAA
  if (Array.isArray(ayuda.entidades_geo)) {
    for (const e of ayuda.entidades_geo) {
      const en = norm(e)
      // buscar si el municipio/provincia mapea a otra CCAA
      for (const [prov, ccaaProv] of Object.entries(PROV_A_CCAA)) {
        if (en.includes(prov) && ccaaProv !== cu) return { motivo:`entidad_geo: ${e} (${ccaaProv})`, si:true }
      }
    }
  }
  return { si:false }
}

async function fetchAyudas() {
  const url = `${SUPABASE_URL}/rest/v1/ayudas?select=*&activa=eq.true&fecha_fin=gte.${HOY}`
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
  return await r.json()
}

async function main() {
  console.log('Descargando ayudas vigentes...')
  const ayudas = await fetchAyudas()
  console.log(`  ${ayudas.length} ayudas vigentes cargadas.\n`)
  console.log('='.repeat(70))

  let totalColadas = 0
  for (const p of PERFILES) {
    const perfil = perfilObj(p)
    const pasan = ayudas
      .map(a => ({ a, score: calcularRelevancia(a, perfil) }))
      .filter(x => x.score >= UMBRAL)

    const coladas = []
    for (const { a } of pasan) {
      const chk = esDeOtraComunidad(a, p.ccaa)
      if (chk.si) coladas.push({ nombre:a.nombre, motivo:chk.motivo })
    }

    console.log(`\n${p.etiqueta}`)
    console.log(`  Ayudas que le pasan el filtro: ${pasan.length}`)
    console.log(`  De OTRA comunidad (coladas): ${coladas.length}`)
    if (coladas.length > 0) {
      totalColadas += coladas.length
      coladas.slice(0, 5).forEach(c => console.log(`    ⚠️  ${c.nombre.slice(0,55)} — ${c.motivo}`))
      if (coladas.length > 5) console.log(`    ... y ${coladas.length - 5} más`)
    } else {
      console.log(`    ✅ Ninguna de otra comunidad`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(totalColadas === 0
    ? '✅ RESULTADO: Ningún perfil recibe ayudas de otra comunidad. Matching geográfico OK.'
    : `⚠️  RESULTADO: ${totalColadas} casos de ayudas coladas de otra comunidad. Revisar.`)
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
