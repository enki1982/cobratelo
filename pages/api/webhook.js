import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

// Desactivar bodyParser para que Stripe pueda verificar la firma
export const config = { api: { bodyParser: false } }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const PRICE_TO_PLAN = {
  'price_1TatI9RcjgMq3SnyPhsdIxYC': 'starter', // 149€
  'price_1TatJ8RcjgMq3Sny71IyZJGr': 'pro',     // 399€
}

async function activarPlan(userId, plan, customerId, subscriptionId) {
  if (!userId) return { error: 'Sin userId' }
  const { error } = await supabaseAdmin
    .from('perfiles')
    .upsert({
      user_id: userId,
      plan,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      plan_updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  return { error }
}

async function getUserIdFromEmail(email) {
  if (!email) return null
  const { data } = await supabaseAdmin.auth.admin.listUsers()
  const user = data?.users?.find(u => u.email === email)
  return user?.id || null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  console.log(`[webhook] Evento: ${event.type}`)

  try {
    switch (event.type) {

      // ── Pago completado (primera suscripción o renovación) ──
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id ||
          await getUserIdFromEmail(session.customer_email)
        const priceId = session.line_items?.data?.[0]?.price?.id ||
          (await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] }))
            .line_items?.data?.[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId] || session.metadata?.plan || 'starter'
        const { error } = await activarPlan(userId, plan, session.customer, session.subscription)
        if (error) console.error('[webhook] Error activarPlan:', error)
        else console.log(`[webhook] Plan '${plan}' activado para user ${userId}`)
        break
      }

      // ── Suscripción actualizada (upgrade/downgrade) ──
      case 'customer.subscription.updated': {
        const sub = event.data.object
        if (sub.status !== 'active') break
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId]
        if (!plan) break
        // Buscar usuario por customer id
        const { data: perfil } = await supabaseAdmin
          .from('perfiles')
          .select('user_id')
          .eq('stripe_customer_id', sub.customer)
          .single()
        if (perfil?.user_id) {
          await activarPlan(perfil.user_id, plan, sub.customer, sub.id)
          console.log(`[webhook] Plan actualizado a '${plan}' para customer ${sub.customer}`)
        }
        break
      }

      // ── Suscripción cancelada ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const { data: perfil } = await supabaseAdmin
          .from('perfiles')
          .select('user_id')
          .eq('stripe_customer_id', sub.customer)
          .single()
        if (perfil?.user_id) {
          await supabaseAdmin
            .from('perfiles')
            .update({ plan: 'free', stripe_subscription_id: null, plan_updated_at: new Date().toISOString() })
            .eq('user_id', perfil.user_id)
          console.log(`[webhook] Plan cancelado → free para customer ${sub.customer}`)
        }
        break
      }

      // ── Pago fallido ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log(`[webhook] Pago fallido para customer ${invoice.customer}`)
        // Aquí podríamos enviar un email de aviso
        break
      }

      default:
        console.log(`[webhook] Evento no gestionado: ${event.type}`)
    }
  } catch (err) {
    console.error('[webhook] Error procesando evento:', err)
    return res.status(500).json({ error: 'Error interno' })
  }

  res.json({ received: true })
}
