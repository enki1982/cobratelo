// Simula el email NUEVO llamando a calcular-ayudas (filtro + IA), SIN enviar nada.
// Muestra el número exacto que recibiría el usuario.
const BASE = 'https://www.cobratelo.es'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

// Tu perfil real
const perfil = {
  situacion: ['autonomo'], nacimiento: ['1982-06-04'], ingresos: ['altos'],
  familia: ['divorciado','sin_cargas'], vivienda: ['alquiler'],
  ccaa: ['Cataluña'], provincia: ['Barcelona'],
  pueblo: [JSON.stringify({ nombre:'Lliçà de Vall', provincia:'Barcelona', ccaa:'Cataluña' })],
}
const MI_USER_ID = '4888f841-8464-404b-8074-cfc25de75c5b'

// Llamar a calcular-ayudas igual que hará el email
const resp = await fetch(`${BASE}/api/calcular-ayudas`, {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ userId: MI_USER_ID, perfil })
})
console.log('Status calcular-ayudas:', resp.status)
if (!resp.ok) { console.log('Error:', await resp.text()); process.exit(1) }
const data = await resp.json()
const ayudas = data.ayudas || []

console.log('\n' + '═'.repeat(55))
console.log('ASÍ SE VERÍA TU EMAIL:')
console.log('═'.repeat(55))
console.log(`\n   Asunto: "Tienes ${ayudas.length} ayudas nuevas que te pueden interesar"`)
console.log(`\n         ${ayudas.length}`)
console.log(`   ${ayudas.length === 1 ? 'ayuda nueva para ti' : 'ayudas nuevas para ti'}`)
console.log(`\n   "Hemos detectado ${ayudas.length} ayudas que encajan con tu perfil.`)
console.log(`    Entra para verlas en detalle."`)
console.log(`\n   [ Ver mis ayudas → ]`)
console.log('\n' + '═'.repeat(55))
console.log(`\nEstas son las ${ayudas.length} ayudas (que vería al entrar, ya filtradas por IA):`)
ayudas.forEach((a,i) => console.log(`   ${i+1}. ${a.nombre.slice(0,55)}`))
// Chequeo: ¿sigue colándose la "Jove"?
const jove = ayudas.filter(a => /jove|joven|juvenil/i.test(a.nombre))
console.log(`\n⚠️  ¿Ayudas "jóvenes" (no deberían, tienes 44)?: ${jove.length}`)
jove.forEach(a => console.log(`     - ${a.nombre.slice(0,50)}`))
