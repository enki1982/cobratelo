import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const PRICE_TO_PLAN = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ALERTAS]: 'alertas',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER]: 'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO]: 'pro',
  'price_1TatI9RcjgMq3SnyPhsdIxYC': 'starter',
  'price_1TatJ8RcjgMq3Sny71IyZJGr': 'pro',
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { priceId } = req.query
  if (!priceId) return res.status(400).json({ error: 'priceId requerido' })

  // Obtener usuario actual
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.['sb-access-token']

  let userId = null
  let userEmail = null
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    userId = user?.id
    userEmail = user?.email
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const plan = PRICE_TO_PLAN[priceId] || 'unknown'

    const GESTOR_PRICES = [
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      'price_1TatI9RcjgMq3SnyPhsdIxYC',
      'price_1TatJ8RcjgMq3Sny71IyZJGr',
    ]
    const isGestorPlan = GESTOR_PRICES.includes(priceId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precios`,
      locale: 'es',
      customer_email: userEmail || undefined,
      metadata: {
        supabase_user_id: userId || '',
        plan,
      },
      subscription_data: {
        trial_period_days: isGestorPlan ? 14 : undefined,
        metadata: {
          supabase_user_id: userId || '',
          plan,
        },
      },
    })
    res.redirect(303, session.url)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
