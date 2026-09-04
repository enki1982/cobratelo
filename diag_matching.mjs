import { calcularRelevancia } from './lib/relevancia.js'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
const HOY = new Date().toISOString().slice(0,10)

const perfilMadrid = {
  situacion:['empleado'],
  ccaa:['Madrid'], provincia:['Madrid'],
  pueblo:[JSON.stringify({nombre:'Madrid',provincia:'Madrid',ccaa:'Madrid'})]
}

const url = `${SUPABASE_URL}/rest/v1/ayudas?select=*&activa=eq.true&fecha_fin=gte.${HOY}`
const r = await fetch(url, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Range':'0-1499' }})
const ayudas = await r.json()
console.log(`Ayudas cargadas: ${ayudas.length}`)

const scores = ayudas.map(a => calcularRelevancia(a, perfilMadrid))
const rangos = { '0 (excluida)':0, '1-19':0, '20-39':0, '40-59':0, '60+':0 }
scores.forEach(s => {
  if (s === 0) rangos['0 (excluida)']++
  else if (s < 20) rangos['1-19']++
  else if (s < 40) rangos['20-39']++
  else if (s < 60) rangos['40-59']++
  else rangos['60+']++
})
console.log('Distribución de scores para usuario de Madrid:')
Object.entries(rangos).forEach(([k,v]) => console.log(`  ${k}: ${v}`))

// Ver ejemplos de las que quedan en 20-39 (casi pasan) para entender qué les falta
console.log('\nEjemplos de ayudas ESTATALES que NO llegan a 40 (deberían salir a un madrileño):')
ayudas.map(a=>({a,s:calcularRelevancia(a,perfilMadrid)}))
  .filter(x => x.a.ambito==='estatal' && x.s > 0 && x.s < 40)
  .slice(0,8)
  .forEach(x => console.log(`  [${x.s}] ${x.a.nombre.slice(0,55)}`))
