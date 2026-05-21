const Stripe = require('stripe')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Obtener sesión del usuario desde Supabase
  const { userId, email } = req.body
  if (!userId) return res.status(401).json({ error: 'No autenticado' })

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

    // Buscar o crear cliente en Stripe
    let customerId
    const { createClient } = require('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    
    const { data: userData } = await sb.from('usuarios').select('stripe_customer_id').eq('id', userId).single()
    
    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({ email, metadata: { supabase_id: userId } })
      customerId = customer.id
      await sb.from('usuarios').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    // Crear sesión del portal de cliente
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/cuenta`,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
