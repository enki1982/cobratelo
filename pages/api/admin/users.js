import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_EMAIL = 'mikinogueras@gmail.com'

const LABELS = {
  empleado:'Empleado/a', autonomo:'Autónomo/a', desempleado:'En paro', pensionista:'Pensionista',
  estudiante:'Estudiante', emprendedor:'Emprendedor/a', alquiler:'Alquiler', propietario:'Propiedad',
  sin_ingresos:'<8k€', bajos:'8-15k€', medios:'15-30k€', altos:'>30k€',
  si_gestoria:'Tiene gestoría', no_gestoria:'Sin gestoría', quiero_gestoria:'Quiere gestoría',
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Acceso denegado' })

  const { data: usuarios } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, plan, perfil, created_at')
    .neq('email', 'mikinogueras@gmail.com')
    .order('created_at', { ascending: false })
    .limit(200)

  // Solo devolvemos datos no sensibles — email, plan, fecha, resumen de perfil
  const lista = (usuarios || []).map(u => {
    const p = u.perfil || {}
    const puebloObj = (() => { try { return JSON.parse((p.pueblo||['{}'])[0]) } catch { return {} } })()
    const edad = p.nacimiento?.[0] ? (() => {
      const hoy = new Date(), nac = new Date(p.nacimiento[0])
      let e = hoy.getFullYear() - nac.getFullYear()
      if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
      return e
    })() : null

    return {
      id: u.id,
      email: u.email,
      plan: u.plan || 'free',
      created_at: u.created_at,
      situacion: (p.situacion || []).map(v => LABELS[v] || v).join(', '),
      vivienda: (p.vivienda || []).map(v => LABELS[v] || v).join(', '),
      ingresos: LABELS[p.ingresos?.[0]] || p.ingresos?.[0] || '',
      gestoria: LABELS[p.gestoria?.[0]] || '',
      edad,
      localidad: puebloObj.nombre ? `${puebloObj.nombre} (${puebloObj.provincia})` : '',
      tiene_perfil: Object.keys(p).length > 0,
    }
  })

  res.json({ usuarios: lista })
}
