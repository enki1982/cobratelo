// Simula qué ayudas saldrían en el email de alertas para un perfil, SIN enviar nada.
import { corresponde } from './lib/matching.js'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
const HOY = new Date().toISOString().slice(0,10)

// Tu perfil real (autónomo, Barcelona, ingresos altos, sin cargas)
const perfil = {
  situacion: ['autonomo'],
  nacimiento: ['1982-06-04'],
  ingresos: ['altos'],
  familia: ['divorciado', 'sin_cargas'],
  vivienda: ['alquiler'],
  ccaa: ['Cataluña'],
  provincia: ['Barcelona'],
  pueblo: [JSON.stringify({ nombre:'Lliçà de Vall', provincia:'Barcelona', ccaa:'Cataluña' })],
}

const r = await fetch(`${SUPABASE_URL}/rest/v1/ayudas?select=*&activa=eq.true&fecha_fin=gte.${HOY}`, {headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Range:'0-1499'}})
const todas = await r.json()

// Misma lógica que el email: filtrar con corresponde()
const nuevas = todas.filter(a => corresponde(a, perfil))

// Cómo se vería el asunto (número honesto)
const n = nuevas.length
const nTexto = n === 1 ? '1 ayuda nueva' : n <= 12 ? `${n} ayudas nuevas` : 'Nuevas ayudas'

console.log('═'.repeat(60))
console.log(`ASUNTO DEL EMAIL: "${nTexto} que te pueden interesar"`)
console.log('═'.repeat(60))
console.log(`\nTotal que le corresponden: ${n}`)
console.log(`\nLas 5 que se mostrarían en el email (con importe si es realista):\n`)
nuevas.slice(0,5).forEach(a => {
  const imp = (a.importe_max && a.importe_max > 0 && a.importe_max <= 30000) ? `${a.importe_max.toLocaleString('es-ES')}€` : '(sin importe mostrado)'
  console.log(`  • ${a.nombre.slice(0,60)}`)
  console.log(`    ${a.organismo?.slice(0,45) || ''} · ${imp} · [${a.ambito}]`)
})
if (n > 5) console.log(`\n  ${n-5 > 15 ? '"Tienes más ayudas disponibles en tu panel"' : `"Y ${n-5} ayudas más disponibles en tu panel"`}`)

// Comprobar que NO hay ruido evidente
console.log(`\n${'─'.repeat(60)}`)
const ruido = nuevas.filter(a => /concurso|certamen|premio|autos locos|espectacul|artes escenicas/i.test(a.nombre))
console.log(`⚠️  Posible ruido (concursos/premios/espectáculos): ${ruido.length}`)
ruido.slice(0,3).forEach(a => console.log(`    - ${a.nombre.slice(0,55)}`))
