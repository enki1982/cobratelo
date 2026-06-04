import { createClient } from '@supabase/supabase-js'
import { enviarEmail } from '../../../lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Versión del texto de consentimiento aceptado (para la traza legal).
// IMPORTANTE: texto BORRADOR generado sin asesoría legal. Pendiente de validación
// por abogado antes de captar clientes reales. Al cambiar el texto, subir la versión.
const CONSENTIMIENTO_VERSION = 'borrador-2026-06-01'

// Genera y envía el enlace de acceso (magic link) al cliente invitado.
async function enviarInvitacion(email, nombre) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (error) { console.error('generateLink:', error.message); return false }
    const link = data?.properties?.action_link
    if (!link) return false
    const html = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#cc5500;font-size:18px">Tu gestoría te ha dado acceso a Cóbratelo.es</h2>
        <p style="color:#333;font-size:14px;line-height:1.6">Hola${nombre ? ' ' + nombre : ''},</p>
        <p style="color:#333;font-size:14px;line-height:1.6">Tu gestoría utiliza Cóbratelo.es para gestionar tus ayudas y subvenciones públicas. Puedes acceder a tu cuenta para ver tu situación con el siguiente enlace:</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#cc5500;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Acceder a mi cuenta</a></p>
        <p style="color:#999;font-size:12px;line-height:1.5">Si no esperabas este correo o no reconoces a tu gestoría, puedes ignorarlo. El enlace caduca por seguridad.</p>
      </div>`
    const r = await enviarEmail({ to: email, subject: 'Tu gestoría te ha dado acceso a Cóbratelo.es', html })
    return r.ok
  } catch (e) { console.error('enviarInvitacion:', e.message); return false }
}

async function getGestorId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.['sb-access-token']
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id || null
}

export default async function handler(req, res) {
  const gestorId = await getGestorId(req)
  if (!gestorId) return res.status(401).json({ error: 'No autenticado' })

  // Verificar plan gestoría
  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('plan')
    .eq('id', gestorId)
    .single()

  if (!['starter', 'pro'].includes(usuario?.plan)) {
    return res.status(403).json({ error: 'Plan gestoría requerido' })
  }

  if (req.method === 'GET') {
    // Listar clientes del gestor
    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .select('*')
      .eq('gestor_id', gestorId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ clientes: data })
  }

  if (req.method === 'POST') {
    // Añadir cliente. Crea (o enlaza) un usuario real de Cóbratelo.
    const { cliente_email, cliente_nombre, dni, telefono, notas, ayudas_ids,
            perfil, consentimiento, avisar } = req.body
    if (!cliente_email) return res.status(400).json({ error: 'Email requerido' })

    // El gestor DEBE declarar el consentimiento del cliente (cobertura RGPD).
    if (!consentimiento) {
      return res.status(400).json({ error: 'Debes declarar que cuentas con el consentimiento del cliente' })
    }

    // Límite de clientes para plan starter
    if (usuario.plan === 'starter') {
      const { count } = await supabaseAdmin
        .from('gestoria_clientes')
        .select('id', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
      if (count >= 50) return res.status(403).json({ error: 'Límite de 50 clientes alcanzado' })
    }

    // Buscar si el cliente ya tiene cuenta; si no, crearla (usuario real).
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    let clienteUser = users?.users?.find(u => u.email === cliente_email)
    let cuentaNueva = false
    if (!clienteUser) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cliente_email,
        email_confirm: true,           // alta sin que tenga que confirmar; el acceso se da por enlace mágico al invitar
        user_metadata: { nombre: cliente_nombre || '', alta_por_gestoria: gestorId },
      })
      if (createErr && !/already/i.test(createErr.message)) {
        return res.status(500).json({ error: 'No se pudo crear la cuenta del cliente: ' + createErr.message })
      }
      clienteUser = created?.user || users?.users?.find(u => u.email === cliente_email)
      cuentaNueva = !!created?.user
      // Crear fila base en usuarios con el perfil que rellena el gestor
      if (clienteUser) {
        await supabaseAdmin.from('usuarios').upsert({
          id: clienteUser.id,
          email: cliente_email,
          plan: 'free',
          perfil: perfil || null,
        }, { onConflict: 'id' })
      }
    } else if (perfil) {
      // Cliente ya existe: no piso su perfil si ya tiene uno; solo relleno si está vacío
      const { data: cd } = await supabaseAdmin.from('usuarios').select('perfil').eq('id', clienteUser.id).single()
      if (!cd?.perfil || Object.keys(cd.perfil).length === 0) {
        await supabaseAdmin.from('usuarios').update({ perfil }).eq('id', clienteUser.id)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .insert({
        gestor_id: gestorId,
        cliente_email,
        cliente_nombre: cliente_nombre || '',
        cliente_id: clienteUser?.id || null,
        dni: dni || null,
        telefono: telefono || null,
        notas: notas || null,
        ayudas_ids: ayudas_ids || [],
        estado: 'activo',
        perfil: perfil || null,
        consentimiento_declarado: true,
        consentimiento_fecha: new Date().toISOString(),
        consentimiento_version: CONSENTIMIENTO_VERSION,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Si el gestor marcó "avisar", enviar enlace de acceso al cliente
    let avisoEnviado = false
    if (avisar && clienteUser) {
      avisoEnviado = await enviarInvitacion(cliente_email, cliente_nombre)
      if (avisoEnviado) {
        await supabaseAdmin.from('gestoria_clientes')
          .update({ invitado: true, invitado_fecha: new Date().toISOString() })
          .eq('id', data.id)
      }
    }

    return res.json({ cliente: data, cuenta_nueva: cuentaNueva, aviso_enviado: avisoEnviado })
  }

  if (req.method === 'PUT') {
    // Actualizar cliente
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })

    // Verificar que el cliente pertenece al gestor
    const { data: existing } = await supabaseAdmin
      .from('gestoria_clientes')
      .select('id')
      .eq('id', id)
      .eq('gestor_id', gestorId)
      .single()

    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' })

    const { data, error } = await supabaseAdmin
      .from('gestoria_clientes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ cliente: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id requerido' })

    await supabaseAdmin
      .from('gestoria_clientes')
      .delete()
      .eq('id', id)
      .eq('gestor_id', gestorId)

    return res.json({ ok: true })
  }

  res.status(405).end()
}
