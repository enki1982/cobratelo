import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const FECHA = 'junio 2026'
const TITULAR = 'Miquel Nogueras Camero — NIF 77609795K — hola@cobratelo.es'
const VERSION_RAT = 'v1.0 — junio 2026'

const s = {
  h2: { fontSize: 17, fontWeight: 700, color: '#1a0d00', marginBottom: 10, marginTop: 24 },
  h3: { fontSize: 14, fontWeight: 700, color: '#cc5500', marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  p: { color: '#444', lineHeight: 1.75, marginBottom: 10, fontSize: 14 },
  ul: { color: '#444', lineHeight: 2, paddingLeft: 20, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: '#1a0d00', color: '#fff', padding: '8px 12px', textAlign: 'left', fontSize: 12 },
  td: { padding: '8px 12px', borderBottom: '1px solid #f0e8dc', verticalAlign: 'top' },
  badge: (c) => ({ background: c, color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block' }),
}

const TABS = [
  { id: 'rat', label: 'RAT' },
  { id: 'brechas', label: 'Brechas' },
  { id: 'derechos', label: 'Derechos' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'consentimientos', label: 'Consentimientos' },
]

export default function AdminRGPD() {
  const router = useRouter()
  const [tab, setTab] = useState('rat')
  const [consentimientos, setConsentimientos] = useState([])
  const [loadingC, setLoadingC] = useState(false)
  const [authed, setAuthed] = useState(false)

  const ADMIN_EMAIL = 'mikinogueras@gmail.com'

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthed(true)
    }
    check()
  }, [])

  useEffect(() => {
    if (tab === 'consentimientos' && authed) {
      setLoadingC(true)
      supabase.from('consentimientos_gestor')
        .select('id,ciudadano_id,email_gestor,ip,fecha,version_legal,activo,revocado_at')
        .order('fecha', { ascending: false })
        .limit(100)
        .then(({ data }) => { setConsentimientos(data || []); setLoadingC(false) })
    }
  }, [tab, authed])

  if (!authed) return <div style={{ minHeight: '100vh', background: '#FFE2C4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#888' }}>Verificando acceso...</p></div>

  return (
    <>
      <Head><title>Cumplimiento RGPD — Admin Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/admin" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13 }}>← Admin</Link>
            <span style={{ color: '#FF8300', fontSize: 13, fontWeight: 600 }}>RGPD / Compliance</span>
          </div>
        </nav>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a0d00', marginBottom: 4 }}>Centro de Cumplimiento RGPD</h1>
            <p style={{ color: '#888', fontSize: 13 }}>Documentación interna — uso exclusivo del responsable del tratamiento · {VERSION_RAT}</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '8px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: tab === t.id ? '#1a0d00' : 'rgba(26,13,0,0.08)',
                  color: tab === t.id ? '#fff' : '#7a4a1a' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff8f2', borderRadius: 16, padding: '28px 32px', border: '1px solid #f0e0cc' }}>

            {/* ===== RAT ===== */}
            {tab === 'rat' && (
              <div>
                <h2 style={s.h2}>Registro de Actividades de Tratamiento (Art. 30 RGPD)</h2>
                <p style={s.p}><strong>Responsable:</strong> {TITULAR} · <strong>Versión:</strong> {VERSION_RAT}</p>

                {[
                  {
                    id: 'T-01', nombre: 'Gestión de cuentas de usuario',
                    finalidad: 'Creación y mantenimiento de cuentas de usuario en la plataforma.',
                    base: 'Ejecución de contrato (Art. 6.1.b)',
                    datos: 'Email, contraseña (hash), fecha de registro, preferencias.',
                    colectivo: 'Ciudadanos usuarios de la plataforma.',
                    conservacion: 'Mientras la cuenta esté activa + 30 días tras baja.',
                    encargados: 'Supabase (UE), Vercel.',
                    transferencias: 'Supabase (UE). Vercel (CCT).',
                    medidas: 'Autenticación JWT, HTTPS/TLS, RLS en base de datos.'
                  },
                  {
                    id: 'T-02', nombre: 'Matching de ayudas públicas',
                    finalidad: 'Analizar el perfil del usuario para identificar ayudas y subvenciones públicas aplicables.',
                    base: 'Ejecución de contrato (Art. 6.1.b) + consentimiento (Art. 6.1.a) para alertas.',
                    datos: 'Situación laboral, ingresos aproximados, edad, comunidad autónoma, composición familiar, pueblo.',
                    colectivo: 'Ciudadanos usuarios registrados.',
                    conservacion: 'Mientras la cuenta esté activa + 30 días.',
                    encargados: 'Supabase (UE), Vercel, Anthropic API (procesamiento de ayudas).',
                    transferencias: 'Anthropic (EE.UU., cláusulas contractuales tipo).',
                    medidas: 'Cifrado en tránsito, pseudonimización de datos en logs.'
                  },
                  {
                    id: 'T-03', nombre: 'Cesión de datos a gestorías',
                    finalidad: 'Comunicar datos del ciudadano a la gestoría elegida para la prestación de servicios profesionales.',
                    base: 'Consentimiento expreso del interesado (Art. 6.1.a).',
                    datos: 'Email, perfil personal y profesional, listado de ayudas relevantes, expedientes.',
                    colectivo: 'Ciudadanos que han autorizado expresamente la cesión.',
                    conservacion: 'Registro de consentimientos: 5 años (prescripción). Datos cedidos: responsabilidad de la gestoría.',
                    encargados: 'Supabase (UE). La gestoría receptora actúa como responsable independiente.',
                    transferencias: 'No hay transferencia internacional. La gestoría es responsable independiente.',
                    medidas: 'Consentimiento registrado con IP, fecha, versión del texto y gestoría seleccionada. RLS.'
                  },
                  {
                    id: 'T-04', nombre: 'Gestión de suscripciones y facturación',
                    finalidad: 'Procesar pagos, gestionar suscripciones y emitir facturas.',
                    base: 'Ejecución de contrato (Art. 6.1.b) + obligación legal (Art. 6.1.c) para conservación fiscal.',
                    datos: 'Email, identificador de cliente Stripe. No se almacenan datos de tarjeta.',
                    colectivo: 'Usuarios con plan de pago.',
                    conservacion: '6 años (obligación fiscal española).',
                    encargados: 'Stripe (PCI-DSS, cláusulas contractuales tipo).',
                    transferencias: 'Stripe (EE.UU., cláusulas contractuales tipo).',
                    medidas: 'No almacenamiento de datos de pago. Stripe gestiona toda la seguridad PCI.'
                  },
                  {
                    id: 'T-05', nombre: 'Comunicaciones transaccionales',
                    finalidad: 'Envío de emails de confirmación, alertas de ayudas y notificaciones del servicio.',
                    base: 'Ejecución de contrato (Art. 6.1.b) para transaccionales. Consentimiento (Art. 6.1.a) para alertas.',
                    datos: 'Email, nombre (si disponible), contenido de la notificación.',
                    colectivo: 'Usuarios registrados.',
                    conservacion: 'Logs de envío: 1 año.',
                    encargados: 'Forward Email (cláusulas contractuales tipo).',
                    transferencias: 'Forward Email (EE.UU., cláusulas contractuales tipo).',
                    medidas: 'HTTPS/TLS. Opción de baja en comunicaciones comerciales.'
                  },
                  {
                    id: 'T-06', nombre: 'Gestión de cuentas profesionales (gestorías)',
                    finalidad: 'Alta, autenticación y gestión de cuentas de gestorías en el plan profesional.',
                    base: 'Ejecución de contrato (Art. 6.1.b).',
                    datos: 'Email profesional, nombre de la gestoría, plan contratado, fecha de alta.',
                    colectivo: 'Gestorías y profesionales con plan Starter o Pro.',
                    conservacion: 'Mientras la cuenta esté activa + 6 años (obligación fiscal).',
                    encargados: 'Supabase (UE), Vercel, Stripe.',
                    transferencias: 'Mismas que T-01 y T-04.',
                    medidas: 'RLS por gestor_id. Segregación total entre gestorías.'
                  },
                  {
                    id: 'T-07', nombre: 'Logs de seguridad y auditoría',
                    finalidad: 'Detección de accesos no autorizados, errores del sistema y auditoría de operaciones críticas.',
                    base: 'Interés legítimo — seguridad de la información (Art. 6.1.f RGPD)',
                    datos: 'Dirección IP, identificador de usuario (anonimizado), tipo de operación, timestamp, resultado de la operación.',
                    colectivo: 'Todos los usuarios que interactúan con la plataforma.',
                    conservacion: '12 meses. Logs de incidentes de seguridad: 5 años.',
                    encargados: 'Supabase (UE), Vercel.',
                    transferencias: 'Mismas que T-01.',
                    medidas: 'Logs de solo lectura. Acceso restringido al administrador. No contienen contraseñas ni datos de pago.'
                  },
                ].map(t => (
                  <div key={t.id} style={{ marginBottom: 24, borderLeft: '3px solid #cc5500', paddingLeft: 16 }}>
                    <p style={{ ...s.p, fontWeight: 700, marginBottom: 4 }}>{t.id} — {t.nombre}</p>
                    <table style={s.table}>
                      <tbody>
                        {[
                          ['Finalidad', t.finalidad],
                          ['Base legal', t.base],
                          ['Categorías de datos', t.datos],
                          ['Colectivo', t.colectivo],
                          ['Conservación', t.conservacion],
                          ['Encargados/Destinatarios', t.encargados],
                          ['Transferencias internacionales', t.transferencias],
                          ['Medidas de seguridad', t.medidas],
                        ].map(([k, v]) => (
                          <tr key={k}><td style={{ ...s.td, fontWeight: 600, color: '#7a4a1a', width: 200, background: '#fff9f5' }}>{k}</td><td style={s.td}>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* ===== BRECHAS ===== */}
            {tab === 'brechas' && (
              <div>
                <h2 style={s.h2}>Procedimiento de Gestión de Brechas de Seguridad</h2>
                <p style={s.p}><strong>Base legal:</strong> Art. 33 y 34 RGPD · <strong>Versión:</strong> {VERSION_RAT}</p>

                <h3 style={s.h3}>1. Definición de brecha</h3>
                <p style={s.p}>Toda violación de la seguridad que cause la destrucción, pérdida, alteración, comunicación no autorizada o acceso no autorizado a datos personales tratados por Cóbratelo.es.</p>

                <h3 style={s.h3}>2. Detección y registro inmediato</h3>
                <ul style={s.ul}>
                  <li>Cualquier indicación de brecha debe comunicarse a <strong>hola@cobratelo.es</strong> de forma inmediata.</li>
                  <li>Registrar: fecha/hora de detección, naturaleza del incidente, sistemas afectados, datos potencialmente comprometidos, número aproximado de afectados.</li>
                  <li>El reloj de 72 horas empieza en el momento de tener <strong>conocimiento razonable</strong> de la brecha.</li>
                </ul>

                <h3 style={s.h3}>3. Evaluación de riesgo (primeras 12 horas)</h3>
                <ul style={s.ul}>
                  <li><strong>Riesgo bajo:</strong> datos cifrados, acceso interno limitado, sin exposición. → No requiere notificación a AEPD ni afectados.</li>
                  <li><strong>Riesgo medio:</strong> datos personales expuestos, número limitado de afectados. → Notificación a AEPD en 72 horas. Registro interno obligatorio.</li>
                  <li><strong>Riesgo alto:</strong> datos sensibles, credenciales, datos de pago, número significativo de afectados. → Notificación a AEPD + notificación a afectados sin dilación.</li>
                </ul>

                <h3 style={s.h3}>4. Contención inmediata</h3>
                <ul style={s.ul}>
                  <li>Aislar los sistemas afectados si es posible.</li>
                  <li>Revocar accesos comprometidos (tokens, contraseñas, claves API).</li>
                  <li>Contactar a Supabase/Vercel si la brecha afecta a su infraestructura: support@supabase.io / support@vercel.com</li>
                  <li>Preservar logs y evidencias para la investigación.</li>
                </ul>

                <h3 style={s.h3}>5. Notificación a la AEPD (si procede, ≤72 horas)</h3>
                <p style={s.p}>Canal: <strong>sedeagpd.gob.es → Sede Electrónica → Notificación de brechas</strong></p>
                <p style={s.p}>Información a incluir: naturaleza de la brecha, categorías y número aproximado de afectados, consecuencias probables, medidas adoptadas o propuestas, datos de contacto del responsable.</p>
                <p style={s.p}>Si no se dispone de toda la información en 72 horas, notificar lo conocido e indicar que se completará en cuanto sea posible.</p>

                <h3 style={s.h3}>6. Notificación a los afectados (si riesgo alto)</h3>
                <p style={s.p}>Comunicar sin dilación indebida, en lenguaje claro y sencillo: naturaleza de la brecha, datos afectados, posibles consecuencias, medidas adoptadas y acciones recomendadas al afectado.</p>
                <p style={s.p}>Canal preferente: email al correo de registro del usuario afectado.</p>

                <h3 style={s.h3}>7. Registro interno (obligatorio en todos los casos)</h3>
                <p style={s.p}>Documentar en el registro interno: fecha detección, descripción, evaluación de riesgo, medidas adoptadas, resultado, fecha de resolución. Conservar durante mínimo 5 años.</p>

                <h3 style={s.h3}>8. Revisión post-incidente</h3>
                <p style={s.p}>En los 30 días posteriores: análisis de causa raíz, actualización de medidas de seguridad, revisión del presente procedimiento si procede.</p>

                <h3 style={s.h3}>Plantilla: Notificación a la AEPD</h3>
                <div style={{ background: '#f8f8f8', border: '1px solid #ddd', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333' }}>{`NOTIFICACIÓN DE BRECHA DE SEGURIDAD — Art. 33 RGPD

Responsable del tratamiento:
  Nombre: Miquel Nogueras Camero
  NIF: 77609795K
  Email: privacidad@cobratelo.es
  Domicilio: Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona)

Fecha y hora de detección: [FECHA Y HORA]
Fecha de esta notificación: [FECHA]

1. NATURALEZA DE LA BRECHA:
   [Describir: acceso no autorizado / pérdida / destrucción / alteración]
   [Sistemas o datos afectados]

2. CATEGORÍAS Y NÚMERO APROXIMADO DE AFECTADOS:
   Categorías de datos: [emails / perfiles / datos de acceso / etc.]
   Número aproximado de interesados afectados: [NÚMERO]
   Número aproximado de registros afectados: [NÚMERO]

3. CONSECUENCIAS PROBABLES:
   [Describir los posibles efectos para los interesados]

4. MEDIDAS ADOPTADAS O PROPUESTAS:
   - [Medida 1]
   - [Medida 2]
   - [Medida 3]

5. INFORMACIÓN ADICIONAL:
   [Si no se dispone de toda la información, indicar cuándo se completará]

DPO / Punto de contacto: privacidad@cobratelo.es`}</div>

                <h3 style={s.h3}>Plantilla: Comunicación a usuarios afectados</h3>
                <div style={{ background: '#f8f8f8', border: '1px solid #ddd', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333' }}>{`Asunto: Información importante sobre la seguridad de tu cuenta en Cóbratelo.es

Estimado/a [NOMBRE],

Te escribimos para informarte de un incidente de seguridad que puede afectar a tus datos personales.

¿QUÉ HA OCURRIDO?
[Descripción clara y sencilla del incidente, sin tecnicismos]

¿QUÉ DATOS PUEDEN ESTAR AFECTADOS?
[Listar solo los datos específicos del usuario afectado]

¿QUÉ PUEDE PASAR?
[Consecuencias posibles en lenguaje claro]

¿QUÉ HEMOS HECHO?
[Medidas de contención adoptadas]
[Fecha en que se resolvió o se espera resolver]

¿QUÉ PUEDES HACER TÚ?
- Cambia tu contraseña en cobratelo.es si utilizas la misma en otros servicios.
- [Otras acciones recomendadas según el tipo de brecha]
- Si detectas actividad inusual, comunícalo a privacidad@cobratelo.es

Para cualquier consulta: privacidad@cobratelo.es

Lamentamos los inconvenientes que esto pueda causarte.

El equipo de Cóbratelo.es`}</div>

                <div style={{ marginTop: 24, background: '#fff0e6', border: '1px solid #cc5500', borderRadius: 8, padding: 16 }}>
                  <p style={{ ...s.p, fontWeight: 700, color: '#cc5500', marginBottom: 4 }}>Contactos de emergencia</p>
                  <ul style={s.ul}>
                    <li>Responsable: Miquel Nogueras Camero — hola@cobratelo.es</li>
                    <li>Supabase: support@supabase.io | status.supabase.com</li>
                    <li>Vercel: support@vercel.com | vercel-status.com</li>
                    <li>Stripe: support.stripe.com</li>
                    <li>AEPD: sedeagpd.gob.es — Tel. 901 100 099</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ===== DERECHOS ===== */}
            {tab === 'derechos' && (
              <div>
                <h2 style={s.h2}>Procedimiento de Ejercicio de Derechos RGPD</h2>
                <p style={s.p}><strong>Base legal:</strong> Arts. 15-22 RGPD · <strong>Versión:</strong> {VERSION_RAT}</p>
                <p style={s.p}><strong>Canal de recepción:</strong> privacidad@cobratelo.es</p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Derecho</th>
                        <th style={s.th}>Art. RGPD</th>
                        <th style={s.th}>Plazo respuesta</th>
                        <th style={s.th}>Procedimiento</th>
                        <th style={s.th}>Excepciones principales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Acceso', 'Art. 15', '1 mes (prorrogable +2 si complejidad)', 'Identificar al solicitante. Localizar todos los datos que le conciernen en Supabase. Enviar copia en formato legible por email. Fecha límite = fecha solicitud + 30 días (informar al solicitante si se prorroga antes de que venza el primer mes).', 'Solicitudes manifiestamente infundadas o excesivas.'],
                        ['Rectificación', 'Art. 16', '1 mes', 'Verificar identidad. Localizar y corregir los datos inexactos. Notificar a destinatarios si se comunicaron datos.', 'Ninguna relevante.'],
                        ['Supresión ("derecho al olvido")', 'Art. 17', '1 mes', 'Verificar que no existe obligación legal de conservación. Eliminar cuenta y datos de Supabase. Solicitar eliminación a subencargados si procede.', 'Obligaciones legales de conservación (6 años para datos fiscales).'],
                        ['Oposición', 'Art. 21', '1 mes', 'Cesar el tratamiento basado en interés legítimo salvo que existan motivos imperiosos. Para comunicaciones comerciales: baja inmediata.', 'Tratamientos basados en contrato u obligación legal.'],
                        ['Limitación', 'Art. 18', '1 mes', 'Marcar los datos como "limitados" en BD. Solo conservar, no tratar. Notificar al solicitante antes de levantar la limitación.', 'Cuando sea necesario para el ejercicio de reclamaciones.'],
                        ['Portabilidad', 'Art. 20', '1 mes', 'Exportar los datos en formato estructurado (CSV/JSON). Entregar por email o transmitir directamente si técnicamente posible.', 'Solo aplica a tratamientos automatizados basados en consentimiento o contrato.'],
                        ['No ser objeto de decisiones automatizadas', 'Art. 22', '1 mes', 'El matching de ayudas es informativo, no decisorio. Informar y revisar manualmente si se solicita.', 'Generalmente no aplicable por ser meramente informativo.'],
                      ].map(([d, art, plazo, proc, exc]) => (
                        <tr key={d}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{d}</td>
                          <td style={{ ...s.td, color: '#cc5500', fontWeight: 600 }}>{art}</td>
                          <td style={s.td}>{plazo}</td>
                          <td style={s.td}>{proc}</td>
                          <td style={{ ...s.td, color: '#888', fontSize: 12 }}>{exc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <p style={{ ...s.p, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>🗓 Calculadora de plazo de respuesta</p>
                  <p style={{ ...s.p, color: '#0369a1', marginBottom: 4 }}>Fecha de recepción de la solicitud:</p>
                  <input type="date" id="fecha-solicitud"
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #bae6fd', marginRight: 8, fontSize: 13 }}
                    onChange={e => {
                      const d = new Date(e.target.value)
                      if (!d || isNaN(d)) return
                      const lim1 = new Date(d); lim1.setDate(lim1.getDate() + 30)
                      const lim2 = new Date(d); lim2.setDate(lim2.getDate() + 90)
                      const fmt = dt => dt.toLocaleDateString('es-ES', {day:'2-digit',month:'2-digit',year:'numeric'})
                      document.getElementById('fecha-limite-1').textContent = fmt(lim1)
                      document.getElementById('fecha-limite-2').textContent = fmt(lim2)
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#0369a1' }}>
                    Plazo ordinario: <strong id="fecha-limite-1">—</strong> · 
                    Con prórroga (casos complejos): <strong id="fecha-limite-2">—</strong>
                  </span>
                </div>

                <h3 style={s.h3}>Pasos generales para toda solicitud</h3>
                <ol style={{ ...s.ul, listStyle: 'decimal' }}>
                  <li>Recepción en privacidad@cobratelo.es — registrar fecha y tipo de derecho.</li>
                  <li>Verificación de identidad — solicitar DNI u otra prueba si hay duda razonable.</li>
                  <li>Evaluación del derecho — ¿procede? ¿existe excepción aplicable?</li>
                  <li>Ejecución — actuar en Supabase y notificar a subencargados si fue necesario.</li>
                  <li>Respuesta al interesado — por email, dentro del plazo, explicando lo hecho o la razón de denegación.</li>
                  <li>Registro interno — documentar la solicitud, decisión y acciones tomadas.</li>
                </ol>

                <h3 style={s.h3}>Denegación de solicitudes</h3>
                <p style={s.p}>Si la solicitud es manifiestamente infundada o excesiva, o si existe excepción legal aplicable, informar al solicitante en el plazo de 1 mes indicando los motivos y su derecho a reclamar ante la AEPD (aepd.es) o ejercer acciones judiciales.</p>
              </div>
            )}

            {/* ===== PROVEEDORES ===== */}
            {tab === 'proveedores' && (
              <div>
                <h2 style={s.h2}>Inventario de Proveedores y Subencargados Tecnológicos</h2>
                <p style={s.p}><strong>Versión:</strong> {VERSION_RAT} · Actualizar cuando se incorpore o retire un proveedor.</p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Proveedor</th>
                        <th style={s.th}>Función</th>
                        <th style={s.th}>País</th>
                        <th style={s.th}>Datos tratados</th>
                        <th style={s.th}>Garantía RGPD</th>
                        <th style={s.th}>Contacto/DPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Supabase Inc.', 'Base de datos, autenticación, RLS', 'UE (servidores) / EE.UU. (empresa)', 'Todos los datos de usuarios y gestorías', 'Cláusulas contractuales tipo (CCT) · Servidores en UE', 'supabase.com/privacy · supabase.com/dpa'],
                        ['Vercel Inc.', 'Infraestructura web, CDN, despliegue', 'EE.UU.', 'IPs, logs de acceso web', 'Cláusulas contractuales tipo (CCT)', 'vercel.com/legal/privacy-policy · vercel.com/dpa'],
                        ['Stripe Inc.', 'Procesamiento de pagos, suscripciones', 'EE.UU.', 'Email, ID cliente Stripe (no datos de tarjeta)', 'CCT + certificación PCI-DSS nivel 1', 'stripe.com/privacy · stripe.com/dpa'],
                        ['Forward Email', 'Envío de emails transaccionales', 'EE.UU.', 'Email destinatario, contenido del mensaje', 'Cláusulas contractuales tipo (CCT)', 'forwardemail.net/privacy'],
                        ['Anthropic PBC', 'Procesamiento de texto para análisis de ayudas (enriquecimiento)', 'EE.UU.', 'Solo descripciones y metadatos de convocatorias públicas — NO se envían datos personales de usuarios', 'CCT · API sin retención de datos', 'anthropic.com/privacy'],
                        ['GoDaddy', 'Registro de dominio cobratelo.es', 'EE.UU.', 'Datos de registro del dominio (titular)', 'CCT', 'godaddy.com/legal/agreements/privacy-policy'],
                        ['Hetzner Online GmbH', 'VPS para agente de actualización de ayudas', 'Alemania (UE)', 'Scripts de actualización, logs del agente', 'RGPD directamente aplicable (UE)', 'hetzner.com/legal/privacy-policy'],
                      ].map(([p, f, pais, datos, garantia, contacto]) => (
                        <tr key={p}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{p}</td>
                          <td style={s.td}>{f}</td>
                          <td style={s.td}>{pais}</td>
                          <td style={s.td}>{datos}</td>
                          <td style={s.td}><span style={s.badge(pais.includes('UE') || pais === 'Alemania (UE)' ? '#22c55e' : '#f59e0b')}>{garantia.split('·')[0].trim()}</span></td>
                          <td style={{ ...s.td, fontSize: 11, color: '#888' }}>{contacto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 24, background: '#fff0e6', borderRadius: 8, padding: 16, border: '1px solid #f0d0b0' }}>
                  <p style={{ ...s.p, fontWeight: 700, marginBottom: 4 }}>Procedimiento de alta de nuevo proveedor</p>
                  <ol style={{ ...s.ul, listStyle: 'decimal' }}>
                    <li>Verificar si trata datos personales de usuarios o gestorías.</li>
                    <li>Revisar su política de privacidad y DPA disponibles.</li>
                    <li>Confirmar garantías RGPD (CCT, EU-US Data Privacy Framework, CCT, país adecuado, etc.).</li>
                    <li>Actualizar este inventario con toda la información.</li>
                    <li>Actualizar la sección de proveedores en la Política de Privacidad pública si el proveedor trata datos de usuarios.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* ===== CONSENTIMIENTOS ===== */}
            {tab === 'consentimientos' && (
              <div>
                <h2 style={s.h2}>Registro de Consentimientos de Cesión de Datos</h2>
                <p style={s.p}>Consentimientos otorgados por ciudadanos para la comunicación de sus datos a gestorías. Base legal: Art. 6.1.a RGPD.</p>

                {loadingC ? (
                  <p style={{ color: '#888', fontSize: 14 }}>Cargando consentimientos...</p>
                ) : consentimientos.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14 }}>No hay consentimientos registrados todavía.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <p style={{ ...s.p, color: '#888' }}>{consentimientos.length} consentimiento{consentimientos.length !== 1 ? 's' : ''} registrado{consentimientos.length !== 1 ? 's' : ''}</p>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Fecha</th>
                          <th style={s.th}>Ciudadano ID</th>
                          <th style={s.th}>Email gestor</th>
                          <th style={s.th}>IP</th>
                          <th style={s.th}>Versión</th>
                          <th style={s.th}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consentimientos.map(c => (
                          <tr key={c.id}>
                            <td style={s.td}>{new Date(c.fecha).toLocaleString('es-ES')}</td>
                            <td style={{ ...s.td, fontSize: 11, fontFamily: 'monospace' }}>{c.ciudadano_id?.substring(0,8)}...</td>
                            <td style={s.td}>{c.email_gestor || '—'}</td>
                            <td style={{ ...s.td, fontSize: 11, fontFamily: 'monospace' }}>{c.ip}</td>
                            <td style={s.td}>{c.version_legal}</td>
                            <td style={s.td}>
                              {c.activo
                                ? <span style={s.badge('#22c55e')}>Activo</span>
                                : <span style={s.badge('#ef4444')}>Revocado {c.revocado_at ? new Date(c.revocado_at).toLocaleDateString('es-ES') : ''}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: 24, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16 }}>
                  <p style={{ ...s.p, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>Nota sobre el registro de IP</p>
                  <p style={{ ...s.p, color: '#0369a1', marginBottom: 0 }}>Actualmente la IP se registra como "0.0.0.0" (insert desde frontend). Para registrar la IP real del ciudadano, mover el insert al endpoint /api/enviar-gestor donde la IP está disponible en el header X-Forwarded-For.</p>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, padding: '16px 0', borderTop: '1px solid #f0e8dc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#aaa', fontSize: 12 }}>Documento interno — uso exclusivo del responsable del tratamiento · No publicar</p>
            <p style={{ color: '#aaa', fontSize: 12 }}>Cóbratelo.es · {VERSION_RAT}</p>
          </div>
        </div>
      </div>
    </>
  )
}
