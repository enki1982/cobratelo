import { evaluar } from './lib/matching.js'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
const HOY = new Date().toISOString().slice(0,10)

// Tu perfil real: autónomo, 43 años (1982), ingresos altos, Lliçà de Vall (Barcelona), sin cargas
const perfilMiki = {
  situacion: ['autonomo'],
  nacimiento: ['1982-06-04'],
  ingresos: ['alto'],
  familia: ['divorciado', 'sin_cargas'],
  vivienda: ['alquiler'],
  ccaa: ['Cataluña'],
  provincia: ['Barcelona'],
  pueblo: [JSON.stringify({ nombre:'Lliçà de Vall', provincia:'Barcelona', ccaa:'Cataluña' })],
}

const r = await fetch(`${SUPABASE_URL}/rest/v1/ayudas?select=*&activa=eq.true&fecha_fin=gte.${HOY}`, {headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Range:'0-1499'}})
const ayudas = await r.json()
console.log(`${ayudas.length} ayudas vigentes\n`)

const corresponden = []
const motivos = {}
for (const a of ayudas) {
  const e = evaluar(a, perfilMiki)
  if (e.corresponde) corresponden.push(a)
  else {
    const cat = e.motivo.split('(')[0].trim()
    motivos[cat] = (motivos[cat]||0) + 1
  }
}

console.log(`✅ LE CORRESPONDEN: ${corresponden.length}`)
corresponden.slice(0,15).forEach(a => console.log(`   - ${a.nombre.slice(0,55)} [${a.ambito}]`))

console.log(`\n❌ DESCARTADAS por motivo:`)
Object.entries(motivos).sort((a,b)=>b[1]-a[1]).forEach(([m,n]) => console.log(`   ${n}× ${m}`))

// Ver cuántas estatales hay y por qué se descartan
const estatales = ayudas.filter(a => (a.ambito||'').toLowerCase()==='estatal')
console.log(`\n📊 De ${estatales.length} ayudas ESTATALES:`)
const estCorr = estatales.filter(a => evaluar(a,perfilMiki).corresponde)
console.log(`   Corresponden: ${estCorr.length}`)
estatales.filter(a=>!evaluar(a,perfilMiki).corresponde).slice(0,5).forEach(a=>{
  console.log(`   ✗ ${a.nombre.slice(0,45)} → ${evaluar(a,perfilMiki).motivo}`)
})
