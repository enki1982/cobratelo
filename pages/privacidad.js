import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function Privacidad() {
  return (
    <>
      <Head><title>Política de Privacidad — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: junio 2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Responsable del tratamiento</h2>
            <ul style={s.ul}>
              <li><strong>Responsable:</strong> Miquel Nogueras Camero</li>
              <li><strong>NIF:</strong> 77609795K</li>
              <li><strong>Domicilio:</strong> Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona)</li>
              <li><strong>Email:</strong> <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a></li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Naturaleza de la plataforma</h2>
            <p style={s.p}>Cóbratelo.es es una plataforma SaaS con dos modalidades: detección de ayudas para ciudadanos, y herramienta de gestión profesional (CRM) para gestorías. Cóbratelo.es actúa como responsable del tratamiento de los datos que recoge directamente. Las gestorías que acceden a datos de ciudadanos con el consentimiento de estos actúan como responsables independientes del tratamiento de esos datos en el marco de su actividad profesional.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Datos que recogemos</h2>
            <ul style={s.ul}>
              <li><strong>Datos de registro:</strong> dirección de email para crear y gestionar la cuenta.</li>
              <li><strong>Datos de perfil:</strong> situación personal y profesional que el usuario facilita voluntariamente (edad, situación laboral, comunidad autónoma, ingresos aproximados, composición familiar, etc.).</li>
              <li><strong>Datos de uso:</strong> páginas visitadas e interacciones, con fines de mejora del servicio.</li>
              <li><strong>Datos de facturación:</strong> en caso de suscripciones de pago, gestionados exclusivamente a través de Stripe. Cóbratelo.es no almacena datos bancarios ni de tarjeta.</li>
              <li><strong>Registro de consentimientos:</strong> cuando el usuario autoriza a una gestoría a acceder a sus datos, se registran la fecha, hora, dirección IP, versión del texto legal aceptado y gestoría seleccionada.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Finalidad y base legal</h2>
            <ul style={s.ul}>
              <li><strong>Prestación del servicio</strong> — base legal: ejecución de contrato (Art. 6.1.b RGPD)</li>
              <li><strong>Envío de alertas sobre ayudas</strong> — base legal: consentimiento (Art. 6.1.a RGPD)</li>
              <li><strong>Cesión de datos a gestoría autorizada por el usuario</strong> — base legal: consentimiento expreso (Art. 6.1.a RGPD)</li>
              <li><strong>Mejora del servicio y análisis estadístico</strong> — base legal: interés legítimo (Art. 6.1.f RGPD)</li>
              <li><strong>Cumplimiento de obligaciones legales</strong> — base legal: obligación legal (Art. 6.1.c RGPD)</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Cesión de datos a gestorías</h2>
            <p style={s.p}>Cuando el usuario ciudadano solicite los servicios de una gestoría a través de la plataforma, deberá otorgar consentimiento expreso, informado y revocable para la cesión de sus datos personales y perfil de ayudas a dicha gestoría.</p>
            <p style={s.p}>La gestoría receptora pasa a actuar como responsable independiente del tratamiento de los datos que recibe para la prestación de sus servicios profesionales, de acuerdo con la normativa RGPD aplicable a su actividad y con las condiciones de acceso aceptadas al contratar Cóbratelo.es.</p>
            <p style={s.p}>Cóbratelo.es facilita la infraestructura para esta cesión autorizada, pero no interviene en la relación profesional entre la gestoría y el ciudadano ni en el tratamiento posterior que la gestoría realice de esos datos.</p>
            <p style={s.p}>El usuario puede revocar este consentimiento en cualquier momento desde su panel de cuenta. La revocación no afectará a los tratamientos ya realizados por la gestoría con anterioridad.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. CRM para profesionales</h2>
            <p style={s.p}>Las gestorías con plan profesional acceden a un CRM donde gestionan clientes, expedientes y actividad. Los datos de ciudadanos visibles en este entorno son exclusivamente los que el propio ciudadano ha autorizado ceder. El acceso está protegido por autenticación, control de acceso por rol y segregación entre gestorías — ninguna gestoría puede acceder a datos de clientes de otra.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Medidas de seguridad</h2>
            <p style={s.p}>Cóbratelo.es aplica las siguientes medidas técnicas y organizativas:</p>
            <ul style={s.ul}>
              <li><strong>Cifrado:</strong> las comunicaciones se protegen mediante HTTPS/TLS. Los datos en reposo se almacenan cifrados en infraestructura certificada.</li>
              <li><strong>Control de accesos:</strong> autenticación por email verificado, control de acceso por rol (ciudadano / gestoría / administrador).</li>
              <li><strong>Segregación entre gestorías:</strong> las políticas de seguridad a nivel de fila (Row Level Security) garantizan que cada gestoría solo accede a sus propios datos.</li>
              <li><strong>Copias de seguridad:</strong> backups automáticos diarios gestionados por el proveedor de base de datos (Supabase).</li>
              <li><strong>Auditoría:</strong> registro de eventos relevantes para detección de accesos no autorizados.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Conservación de datos</h2>
            <p style={s.p}>Los datos se conservan mientras el usuario mantenga su cuenta activa. Tras la eliminación, se eliminan en un plazo máximo de 30 días, salvo obligación legal (hasta 6 años para datos fiscales). Los registros de consentimiento se conservan durante el plazo de prescripción de acciones legales aplicable.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Proveedores, subencargados y transferencias internacionales</h2>
            <p style={s.p}>Cóbratelo.es trabaja con los siguientes proveedores, todos con garantías RGPD adecuadas:</p>
            <ul style={s.ul}>
              <li><strong>Supabase Inc.</strong> (EE.UU.) — base de datos e infraestructura. Servidores ubicados en la UE. Cláusulas contractuales tipo UE.</li>
              <li><strong>Vercel Inc.</strong> (EE.UU.) — infraestructura web. Cláusulas contractuales tipo UE.</li>
              <li><strong>Stripe Inc.</strong> (EE.UU.) — procesamiento de pagos. Certificado PCI-DSS. Cláusulas contractuales tipo UE.</li>
              <li><strong>Forward Email</strong> — envío de correos transaccionales. Servidores en EE.UU. con cláusulas contractuales tipo UE.</li>
            </ul>
            <p style={s.p}>Estas transferencias internacionales se realizan al amparo de las cláusulas contractuales tipo aprobadas por la Comisión Europea (Art. 46 RGPD).</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Derechos del usuario</h2>
            <p style={s.p}>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a>. Responderemos en el plazo máximo de un mes. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Cookies</h2>
            <p style={s.p}>Utilizamos cookies estrictamente necesarias para el funcionamiento del servicio (sesión de usuario). Consulta nuestra <Link href="/cookies" style={{ color: '#cc5500' }}>Política de Cookies</Link> para más información.</p>
          </section>
        </div>
      </div>
    </>
  )
}
