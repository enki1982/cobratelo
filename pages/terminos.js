import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function Terminos() {
  return (
    <>
      <Head>
        <title>Términos de Uso — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Términos de Uso</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: junio 2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Aceptación</h2>
            <p style={s.p}>
              El acceso y uso de Cóbratelo.es implica la aceptación plena de estos Términos de Uso. Si no estás de acuerdo con alguna de las condiciones, debes abstenerte de usar el servicio. El titular del servicio es Miquel Nogueras Camero (NIF 77609795K).
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Descripción del servicio</h2>
            <p style={s.p}>
              Cóbratelo.es es una plataforma SaaS que ofrece dos modalidades de servicio:
            </p>
            <ul style={s.ul}>
              <li><strong>Servicio para ciudadanos:</strong> detección personalizada de ayudas, subvenciones y prestaciones públicas disponibles en España en función del perfil del usuario. La información proporcionada tiene carácter orientativo y procede de fuentes públicas oficiales.</li>
              <li><strong>Servicio para gestorías (planes Starter y Pro):</strong> plataforma SaaS profesional para la gestión de clientes, expedientes y tramitación de ayudas públicas. Descrito en detalle en la sección 5 de estos términos.</li>
            </ul>
            <p style={s.p}>
              Cóbratelo.es no actúa como gestoría, asesoría jurídica ni representante legal del usuario ante ninguna administración pública.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Planes y precios</h2>
            <ul style={s.ul}>
              <li><strong>Plan Particular (gratuito):</strong> acceso completo a la detección de ayudas personalizadas, alertas semanales de novedades y cuestionario de perfil. Sin coste, sin tarjeta de crédito.</li>
              <li><strong>Plan Gestoría Starter (149 €/mes + IVA):</strong> acceso profesional para gestión de hasta 50 clientes activos, panel CRM, informes individuales y alertas automáticas por cliente.</li>
              <li><strong>Plan Gestoría Pro (399 €/mes + IVA):</strong> clientes ilimitados, todas las funcionalidades del plan Starter, panel multi-cliente y soporte prioritario.</li>
            </ul>
            <p style={s.p}>Los precios pueden ser modificados con un preaviso mínimo de 30 días a los usuarios con suscripción activa.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Facturación y cancelación</h2>
            <p style={s.p}>
              Las suscripciones de pago se renuevan automáticamente cada mes en la fecha de contratación. El pago se procesa a través de Stripe, plataforma certificada PCI-DSS. Cóbratelo.es no almacena datos de tarjeta bancaria.
            </p>
            <p style={s.p}>
              El usuario puede cancelar su suscripción en cualquier momento desde su panel de cuenta. La cancelación tendrá efecto al final del período de facturación en curso, sin reembolso proporcional por el tiempo no consumido.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Servicios para gestorías</h2>
            <p style={s.p}>
              Cóbratelo.es ofrece una plataforma SaaS destinada a profesionales y gestorías para la gestión de clientes, expedientes, ayudas y subvenciones. Al contratar un plan profesional, la gestoría acepta además el Contrato de Licencia SaaS disponible en <Link href="/contrato-saas" style={{ color: '#cc5500' }}>cobratelo.es/contrato-saas</Link>.
            </p>
            <ul style={s.ul}>
              <li>El uso de la plataforma no implica relación laboral, societaria ni de representación entre Cóbratelo.es y las gestorías usuarias.</li>
              <li>Cada gestoría es responsable exclusiva de los servicios profesionales que presta a sus clientes y del cumplimiento de la normativa aplicable a su actividad.</li>
              <li>La gestoría únicamente accede a los datos de ciudadanos que estos hayan autorizado expresamente.</li>
              <li>La gestoría se compromete a suscribir el Acuerdo de Encargo de Tratamiento (DPA) disponible en <Link href="/dpa" style={{ color: '#cc5500' }}>cobratelo.es/dpa</Link> antes de operar con datos de terceros.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Obligaciones del usuario</h2>
            <ul style={s.ul}>
              <li>Facilitar información veraz y actualizada en su perfil.</li>
              <li>No usar el servicio para fines ilícitos o contrarios a estos términos.</li>
              <li>No intentar acceder a datos de otros usuarios ni vulnerar la seguridad del sistema.</li>
              <li>No reproducir, distribuir ni comercializar el contenido del servicio sin autorización expresa.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Limitación de responsabilidad</h2>
            <p style={s.p}>
              Cóbratelo.es no se responsabiliza de las decisiones tomadas por el usuario basándose en la información proporcionada, de los resultados obtenidos en procesos de solicitud de ayudas, ni de la disponibilidad ininterrumpida del servicio. El servicio se presta sin garantía de resultados.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Modificaciones</h2>
            <p style={s.p}>
              Cóbratelo.es se reserva el derecho de modificar estos términos con un preaviso de 15 días para cambios relevantes. El uso continuado del servicio tras la comunicación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Legislación aplicable</h2>
            <p style={s.p}>
              Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
