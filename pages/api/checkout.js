const Stripe = require('stripe')

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { priceId } = req.query
  if (!priceId) return res.status(400).json({ error: 'priceId requerido' })

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precios`,
      locale: 'es',
    })
    res.redirect(303, session.url)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
