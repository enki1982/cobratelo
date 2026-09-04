#!/usr/bin/env node
// Valida el NUEVO motor de exclusión contra las ayudas reales.
import { evaluar } from './lib/matching.js'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
const HOY = new Date().toISOString().slice(0,10)

const PROV_CCAA = {'madrid':'madrid','barcelona':'cataluna','girona':'cataluna','lleida':'cataluna','tarragona':'cataluna','sevilla':'andalucia','malaga':'andalucia','cadiz':'andalucia','granada':'andalucia','cordoba':'andalucia','huelva':'andalucia','jaen':'andalucia','almeria':'andalucia','valencia':'valenciana','alicante':'valenciana','castellon':'valenciana','a coruna':'galicia','lugo':'galicia','ourense':'galicia','pontevedra':'galicia','vizcaya':'pais vasco','guipuzcoa':'pais vasco','alava':'pais vasco','zaragoza':'aragon','huesca':'aragon','teruel':'aragon','badajoz':'extremadura','caceres':'extremadura','valladolid':'castilla y leon','leon':'castilla y leon'}
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()

const PERFILES = [
  { et:'Madrid empleado 40a',   ccaa:'Madrid', prov:'Madrid', pue:'Madrid', sit:['empleado'], nac:'1985-01-01' },
  { et:'Sevilla autónomo',      ccaa:'Andalucía', prov:'Sevilla', pue:'Sevilla', sit:['autonomo'] },
  { et:'Barcelona empleado',    ccaa:'Cataluña', prov:'Barcelona', pue:'Barcelona', sit:['empleado'] },
  { et:'Valencia desempleado',  ccaa:'Comunidad Valenciana', prov:'Valencia', pue:'Valencia', sit:['desempleado'] },
  { et:'Bilbao pensionista 70a',ccaa:'País Vasco', prov:'Vizcaya', pue:'Bilbao', sit:['pensionista'], nac:'1955-01-01' },
]
const perfilObj = p => ({ situacion:p.sit, ccaa:[p.ccaa], provincia:[p.prov], pueblo:[JSON.stringify({nombre:p.pue,provincia:p.prov,ccaa:p.ccaa})], ...(p.nac?{nacimiento:[p.nac]}:{}) })

function ccaaDe(l){const n=norm(l);for(const[pr,cc]of Object.entries(PROV_CCAA))if(n.includes(pr))return cc;return null}
function esDeOtra(a, ccaaU){
  const cu=norm(ccaaU), ca=norm(a.comunidad_autonoma)
  if(ca&&ca!=='estatal'&&ca!==cu)return true
  if(Array.isArray(a.entidades_geo))for(const e of a.entidades_geo){const c=ccaaDe(e);if(c&&c!==cu)return true}
  return false
}

const r = await fetch(`${SUPABASE_URL}/rest/v1/ayudas?select=*&activa=eq.true&fecha_fin=gte.${HOY}`, {headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Range:'0-1499'}})
const ayudas = await r.json()
console.log(`${ayudas.length} ayudas vigentes reales\n${'='.repeat(60)}`)

let coladasTotal=0
for(const p of PERFILES){
  const perfil=perfilObj(p)
  const pasan=ayudas.filter(a=>evaluar(a,perfil).corresponde)
  const coladas=pasan.filter(a=>esDeOtra(a,p.ccaa))
  coladasTotal+=coladas.length
  console.log(`\n${p.et}`)
  console.log(`  Le corresponden: ${pasan.length}`)
  console.log(`  De otra comunidad (coladas): ${coladas.length} ${coladas.length===0?'✅':'⚠️'}`)
  coladas.slice(0,3).forEach(c=>console.log(`    ⚠️ ${c.nombre.slice(0,50)}`))
}
console.log(`\n${'='.repeat(60)}`)
console.log(coladasTotal===0?'✅ Ningún perfil recibe ayudas de otra comunidad':`⚠️ ${coladasTotal} coladas`)
