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
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ALERTAS]:  'alertas',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER]:  'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO]:       'pro',
  'price_1TatI9RcjgMq3SnyPhsdIxYC': 'starter',
  'price_1TatJ8RcjgMq3Sny71IyZJGr': 'pro',
}

// Buscar userId en tabla usuarios por email — sin listUsers() masivo
async function userIdByEmail(email) {
  if (!email) return null
  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id || null
}

async function activarPlan(userId, plan) {
  if (!userId || !plan) return
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({ plan })
    .eq('id', userId)
  if (error) console.error('activarPlan error:', error)
  else console.log(`✅ Plan ${plan} activado — usuario ${userId}`)
}

async function desactivarPlan(userId) {
  if (!userId) return
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({ plan: 'free' })
    .eq('id', userId)
  if (error) console.error('desactivarPlan error:', error)
  else console.log(`Plan → free — usuario ${userId}`)
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

      // Pago inicial del checkout (suscripción nueva o one-time)
      case 'checkout.session.completed': {
        const session = event.data.object
        let userId = session.metadata?.supabase_user_id || null
        const plan  = session.metadata?.plan

        // Fallback: buscar por email en tabla usuarios (sin listUsers masivo)
        if (!userId && session.customer_email) {
          userId = await userIdByEmail(session.customer_email)
        }

        if (userId && plan && plan !== 'unknown') {
          await activarPlan(userId, plan)
        } else {
          console.warn('checkout.session.completed: userId o plan no resueltos', { userId, plan })
        }
        break
      }

      // Pago recurrente mensual — CRÍTICO para mantener el plan activo
      case 'invoice.paid': {
        const invoice = event.data.object
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
          const subId = invoice.subscription
          if (!subId) break

          const sub = await stripe.subscriptions.retrieve(subId)
          let userId = sub.metadata?.supabase_user_id || null
          const priceId = sub.items?.data?.[0]?.price?.id
          const plan = PRICE_TO_PLAN[priceId]

          if (!userId && invoice.customer_email) {
            userId = await userIdByEmail(invoice.customer_email)
          }

          if (userId && plan) await activarPlan(userId, plan)
        }
        break
      }

      // Cambio de plan (upgrade/downgrade desde portal)
      case 'customer.subscription.updated': {
        const sub = event.data.object
        let userId = sub.metadata?.supabase_user_id || null
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId]

        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer)
          userId = await userIdByEmail(customer.email)
        }

        if (sub.status === 'active' && userId && plan) {
          await activarPlan(userId, plan)
        } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status) && userId) {
          await desactivarPlan(userId)
        }
        break
      }

      // Cancelación de suscripción
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        let userId = sub.metadata?.supabase_user_id || null
        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer)
          userId = await userIdByEmail(customer.email)
        }
        if (userId) await desactivarPlan(userId)
        break
      }

      // Pago fallido — log sin desactivar (Stripe reintentará)
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.warn(`Pago fallido — customer: ${invoice.customer}, amount: ${invoice.amount_due}`)
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Error procesando webhook:', err)
    res.status(500).json({ error: err.message })
  }
}
