import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function Terminos() {
  return (
    <>
      <Head><title>Términos de Uso — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Términos de Uso</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: junio 2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Aceptación</h2>
            <p style={s.p}>El acceso y uso de Cóbratelo.es implica la aceptación plena de estos Términos. El titular es Miquel Nogueras Camero (NIF 77609795K).</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Descripción del servicio</h2>
            <p style={s.p}>Cóbratelo.es es una plataforma SaaS con dos modalidades: detección de ayudas para ciudadanos, y herramienta de gestión profesional (CRM) para gestorías. No actúa como gestoría ni representante legal del usuario.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Planes y precios</h2>
            <ul style={s.ul}>
              <li><strong>Plan Particular (gratuito):</strong> detección de ayudas personalizadas, alertas semanales y cuestionario de perfil.</li>
              <li><strong>Plan Gestoría Starter (149 €/mes + IVA):</strong> hasta 50 clientes activos, CRM, informes y alertas por cliente.</li>
              <li><strong>Plan Gestoría Pro (399 €/mes + IVA):</strong> clientes ilimitados, todas las funcionalidades Starter y soporte prioritario.</li>
            </ul>
            <p style={s.p}>Los precios pueden modificarse con preaviso mínimo de 30 días a suscriptores activos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Facturación y cancelación</h2>
            <p style={s.p}>Las suscripciones se renuevan automáticamente cada mes. El pago se procesa mediante Stripe (PCI-DSS). Cóbratelo.es no almacena datos bancarios.</p>
            <p style={s.p}>El usuario puede cancelar en cualquier momento desde su panel. La cancelación surte efecto al final del período facturado, sin reembolso proporcional.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Servicios para gestorías</h2>
            <p style={s.p}>Cóbratelo.es ofrece una plataforma SaaS para gestorías y profesionales que gestionen ayudas públicas para sus clientes. Al contratar un plan profesional, la gestoría acepta también el <Link href="/contrato-saas" style={{ color: '#cc5500' }}>Contrato de Licencia SaaS</Link>.</p>
            <ul style={s.ul}>
              <li>El uso de la plataforma no implica relación laboral, societaria ni de representación entre Cóbratelo.es y la gestoría.</li>
              <li>Cada gestoría es responsable de los servicios profesionales que presta a sus clientes y del cumplimiento normativo aplicable a su actividad.</li>
              <li>La gestoría accede únicamente a datos de ciudadanos que han otorgado consentimiento expreso.</li>
              <li>La gestoría actúa como responsable independiente del tratamiento de los datos que recibe.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Obligaciones del usuario</h2>
            <ul style={s.ul}>
              <li>Facilitar información veraz y actualizada.</li>
              <li>No usar el servicio para fines ilícitos.</li>
              <li>No intentar acceder a datos de otros usuarios.</li>
              <li>No reproducir, distribuir ni comercializar el contenido sin autorización.</li>
              <li>No realizar scraping, extracción masiva ni automatización no autorizada.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Suspensión y cancelación de cuentas</h2>
            <p style={s.p}>Cóbratelo.es se reserva el derecho de:</p>
            <ul style={s.ul}>
              <li>Suspender temporalmente el acceso de cualquier usuario que incumpla estos términos, sin necesidad de preaviso.</li>
              <li>Cancelar definitivamente cuentas en caso de uso fraudulento, impago reiterado, actividades ilícitas o violaciones graves de estos términos.</li>
              <li>Restringir el acceso de gestorías cuya actividad sea contraria a la normativa aplicable o cause perjuicio a ciudadanos usuarios.</li>
            </ul>
            <p style={s.p}>En caso de cancelación por incumplimiento, no procederá reembolso de cantidades abonadas.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Propiedad intelectual</h2>
            <p style={s.p}>El código fuente, diseño, base de datos de ayudas, algoritmos de matching, metodología y marca de Cóbratelo.es son propiedad exclusiva de Miquel Nogueras Camero y están protegidos por la normativa de propiedad intelectual e industrial. La licencia de uso no otorga ningún derecho de propiedad sobre la plataforma. Queda prohibida la ingeniería inversa, descompilación o cualquier intento de acceder al código fuente.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Limitación de responsabilidad</h2>
            <p style={s.p}>Cóbratelo.es no se responsabiliza de los resultados obtenidos en procesos de solicitud de ayudas, de la actuación de gestorías independientes, ni de la disponibilidad ininterrumpida del servicio. El servicio se presta sin garantía de resultados.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Fuerza mayor</h2>
            <p style={s.p}>Cóbratelo.es no será responsable por incumplimientos o retrasos causados por circunstancias fuera de su control razonable, incluyendo:</p>
            <ul style={s.ul}>
              <li>Caídas o interrupciones de servicios de infraestructura de terceros (Vercel, Supabase, Stripe, etc.).</li>
              <li>Interrupciones de internet o redes de telecomunicaciones.</li>
              <li>Ciberataques, intrusiones o incidentes de seguridad de terceros.</li>
              <li>Decisiones administrativas, regulatorias o judiciales.</li>
              <li>Catástrofes naturales u otras causas de fuerza mayor.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Modificaciones</h2>
            <p style={s.p}>Cóbratelo.es puede modificar estos términos con preaviso de 15 días para cambios relevantes. El uso continuado tras la comunicación implica su aceptación.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Legislación y jurisdicción</h2>
            <p style={s.p}>Estos términos se rigen por la legislación española. Las controversias se someten a los juzgados y tribunales de Barcelona.</p>
          </section>
        </div>
      </div>
    </>
  )
}
