import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_EMAIL = 'mikinogueras@gmail.com'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Verificar que es el admin
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Acceso denegado' })

  try {
    // Usuarios
    const { data: usuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, plan, perfil, created_at, updated_at')
      .order('created_at', { ascending: false })

    const ahora = new Date()
    const hace7 = new Date(ahora - 7 * 86400000)
    const hace30 = new Date(ahora - 30 * 86400000)
    const hoy = new Date(ahora.toDateString())

    // Excluir admin del conteo
    const ADMIN_EMAIL = 'mikinogueras@gmail.com'
    const usuariosSinAdmin = (usuarios || []).filter(u => u.email !== ADMIN_EMAIL)

    const total = usuariosSinAdmin.length || 0
    const hoy_ = usuariosSinAdmin.filter(u => new Date(u.created_at) >= hoy).length || 0
    const semana = usuariosSinAdmin.filter(u => new Date(u.created_at) >= hace7).length || 0
    const mes = usuariosSinAdmin.filter(u => new Date(u.created_at) >= hace30).length || 0

    const planes = { free: 0, alertas: 0, starter: 0, pro: 0 }
    usuariosSinAdmin.forEach(u => { if (planes[u.plan] !== undefined) planes[u.plan]++ })

    // Registros por día últimos 30 días
    const porDia = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(ahora - i * 86400000)
      const key = d.toISOString().split('T')[0]
      porDia[key] = 0
    }
    usuarios?.forEach(u => {
      const key = u.created_at?.split('T')[0]
      if (key && porDia[key] !== undefined) porDia[key]++
    })

    // Gestorías vs particulares
    const gestores = usuarios?.filter(u => u.perfil?.gestoria?.[0] === 'si_gestoria').length || 0
    const quieren_gestor = usuarios?.filter(u => u.perfil?.gestoria?.[0] === 'quiero_gestoria').length || 0
    const particulares = total - gestores

    // Billing desde Stripe
    let billing = { hoy: 0, semana: 0, mes: 0, total: 0, suscripciones: 0 }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

      // Price IDs de cobratelo.es — filtrar solo estos productos
      const COBRATELO_PRICES = [
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ALERTAS,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      ].filter(Boolean)

      // Suscripciones activas solo de cobratelo.es
      const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
      const subsCobratelo = subs.data.filter(s =>
        s.items.data.some(item => COBRATELO_PRICES.includes(item.price.id))
      )
      const subsIds = new Set(subsCobratelo.map(s => s.id))

      // Facturas solo de cobratelo.es (más fiable que charges para suscripciones)
      const filtrarFacturas = invoices => invoices.data
        .filter(inv => inv.paid && subsIds.has(inv.subscription))
        .reduce((a, inv) => a + inv.amount_paid, 0) / 100

      const [invToday, invWeek, invMonth] = await Promise.all([
        stripe.invoices.list({ created: { gte: Math.floor(hoy.getTime() / 1000) }, limit: 100 }),
        stripe.invoices.list({ created: { gte: Math.floor(hace7.getTime() / 1000) }, limit: 100 }),
        stripe.invoices.list({ created: { gte: Math.floor(hace30.getTime() / 1000) }, limit: 100 }),
      ])

      billing = {
        hoy: filtrarFacturas(invToday),
        semana: filtrarFacturas(invWeek),
        mes: filtrarFacturas(invMonth),
        suscripciones: subsCobratelo.length,
      }
    } catch (e) { console.error('Stripe error:', e.message) }

    res.json({ total, hoy: hoy_, semana, mes, planes, porDia, gestores, quieren_gestor, particulares, billing })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
