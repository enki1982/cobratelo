import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
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
            <h2 style={s.h2}>2. Qué es Cóbratelo.es</h2>
            <p style={s.p}>Cóbratelo.es es una plataforma SaaS española con dos modalidades de uso:</p>
            <ul style={s.ul}>
              <li><strong>Para ciudadanos:</strong> detección personalizada de ayudas, subvenciones y prestaciones públicas a partir del perfil del usuario.</li>
              <li><strong>Para gestorías y profesionales:</strong> herramienta de gestión (CRM) que permite a profesionales del sector administrativo gestionar clientes, expedientes y tramitación de ayudas a través de un panel privado.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Datos que recogemos</h2>
            <ul style={s.ul}>
              <li><strong>Datos de registro:</strong> dirección de email para crear y gestionar tu cuenta.</li>
              <li><strong>Datos de perfil:</strong> información sobre tu situación personal y profesional que facilitas voluntariamente para recibir resultados personalizados (edad, situación laboral, comunidad autónoma, ingresos aproximados, etc.).</li>
              <li><strong>Datos de uso:</strong> páginas visitadas, interacciones con el servicio, con fines de mejora y análisis agregado.</li>
              <li><strong>Datos de facturación:</strong> en el caso de suscripciones de pago, gestionados exclusivamente a través de Stripe. Cóbratelo.es no almacena datos bancarios ni de tarjeta.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Finalidad y base legal del tratamiento</h2>
            <ul style={s.ul}>
              <li><strong>Prestación del servicio</strong> — base legal: ejecución de contrato (Art. 6.1.b RGPD)</li>
              <li><strong>Envío de alertas y comunicaciones sobre ayudas</strong> — base legal: consentimiento (Art. 6.1.a RGPD)</li>
              <li><strong>Gestión de expedientes por profesionales autorizados</strong> — base legal: consentimiento expreso del ciudadano (Art. 6.1.a RGPD)</li>
              <li><strong>Mejora del servicio y análisis estadístico</strong> — base legal: interés legítimo (Art. 6.1.f RGPD)</li>
              <li><strong>Cumplimiento de obligaciones legales</strong> — base legal: obligación legal (Art. 6.1.c RGPD)</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Comunicación de datos a gestorías</h2>
            <p style={s.p}>
              Cuando el usuario ciudadano solicite la intervención de una gestoría a través de la plataforma, podrá autorizar expresamente la comunicación de sus datos personales y perfil de ayudas a la gestoría seleccionada.
            </p>
            <p style={s.p}>
              Esta autorización es voluntaria, revocable en cualquier momento y necesaria para que la gestoría pueda prestar sus servicios profesionales. Sin este consentimiento, Cóbratelo.es no comunicará ningún dato personal a terceros.
            </p>
            <p style={s.p}>
              La gestoría receptora actúa como responsable del tratamiento respecto de los datos que recibe para la prestación de sus servicios profesionales al ciudadano, de conformidad con el Acuerdo de Encargo de Tratamiento suscrito con Cóbratelo.es.
            </p>
            <p style={s.p}>
              Cóbratelo.es únicamente facilita la comunicación autorizada por el usuario y proporciona la infraestructura tecnológica necesaria para la gestión de expedientes. No interviene en la relación profesional entre la gestoría y el ciudadano.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. CRM para profesionales</h2>
            <p style={s.p}>
              Las gestorías que contraten un plan profesional tienen acceso a un panel de gestión (CRM) donde pueden gestionar clientes, crear expedientes, documentar actividad y realizar seguimiento de tramitaciones. Los datos almacenados en este entorno están protegidos por controles de acceso por rol y solo son accesibles por la gestoría titular de la cuenta.
            </p>
            <p style={s.p}>
              Los datos de ciudadanos que aparecen en el CRM son únicamente los que el propio ciudadano ha autorizado expresamente compartir con esa gestoría.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Conservación de datos</h2>
            <p style={s.p}>
              Los datos se conservan mientras el usuario mantenga su cuenta activa. Tras la eliminación de la cuenta, los datos se eliminan en un plazo máximo de 30 días, salvo aquellos que deban conservarse por obligación legal (hasta 6 años para datos fiscales).
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Proveedores y subencargados</h2>
            <ul style={s.ul}>
              <li><strong>Supabase</strong> — base de datos y autenticación (servidores en UE)</li>
              <li><strong>Stripe</strong> — procesamiento de pagos (certificado PCI-DSS)</li>
              <li><strong>Vercel</strong> — infraestructura web</li>
              <li><strong>Forward Email</strong> — envío de correos transaccionales</li>
            </ul>
            <p style={s.p}>Todos los proveedores cuentan con garantías adecuadas de protección de datos conforme al RGPD.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Derechos del usuario</h2>
            <p style={s.p}>
              Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a>. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Cookies</h2>
            <p style={s.p}>
              Utilizamos cookies estrictamente necesarias para el funcionamiento del servicio (sesión de usuario). No utilizamos cookies de publicidad ni de seguimiento de terceros sin consentimiento previo.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
