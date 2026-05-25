import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const PRICE_TO_PLAN = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ALERTAS]: 'alertas',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER]: 'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO]: 'pro',
}

async function activarPlan(userId, plan) {
  if (!userId) return
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({ plan })
    .eq('id', userId)
  if (error) console.error('Error activando plan:', error)
  else console.log(`✅ Plan ${plan} activado para ${userId}`)
}

async function desactivarPlan(userId) {
  if (!userId) return
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({ plan: 'free' })
    .eq('id', userId)
  if (error) console.error('Error desactivando plan:', error)
  else console.log(`Plan reseteado a free para ${userId}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  const buf = await buffer(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  console.log('Stripe event:', event.type)

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan

        if (userId && plan && plan !== 'unknown') {
          await activarPlan(userId, plan)
        } else if (session.customer_email) {
          // Buscar por email si no hay userId
          const { data } = await supabaseAdmin.auth.admin.listUsers()
          const user = data?.users?.find(u => u.email === session.customer_email)
          if (user && plan) await activarPlan(user.id, plan)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.supabase_user_id
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId]

        if (sub.status === 'active' && userId && plan) {
          await activarPlan(userId, plan)
        } else if (sub.status !== 'active' && userId) {
          await desactivarPlan(userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = sub.metadata?.supabase_user_id
        if (userId) await desactivarPlan(userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = sub.metadata?.supabase_user_id
        if (userId) {
          console.warn(`Pago fallido para ${userId}`)
          // No desactivamos de inmediato — Stripe reintentará
        }
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Error procesando webhook:', err)
    res.status(500).json({ error: err.message })
  }
}
