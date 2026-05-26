import Head from 'next/head'
import Link from 'next/link'

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
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: mayo 2026</p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>1. Aceptación de los términos</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              El acceso y uso de Cóbratelo.es implica la aceptación plena de estos Términos de Uso. Si no estás de acuerdo con alguna de las condiciones, debes abstenerte de usar el servicio. El titular del servicio es Miquel Nogueras Camero (NIF 77609795K).
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>2. Descripción del servicio</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Cóbratelo.es es una plataforma digital de carácter <strong>exclusivamente informativo</strong> que facilita la detección de ayudas, subvenciones y prestaciones públicas disponibles en España en función del perfil del usuario.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              El servicio <strong>no actúa como gestoría, asesoría jurídica ni representante legal</strong> del usuario ante ninguna administración pública. La tramitación de cualquier ayuda es responsabilidad exclusiva del usuario o del profesional que este designe.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              La información proporcionada procede de fuentes públicas oficiales y tiene carácter orientativo. Cóbratelo.es no garantiza la exactitud, vigencia ni disponibilidad de las convocatorias mostradas. El usuario debe verificar siempre la información en la fuente oficial correspondiente antes de iniciar cualquier trámite.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>3. Planes y precios</h2>
            <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 12 }}>El servicio se presta en las siguientes modalidades:</p>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Plan Particular (gratuito):</strong> acceso completo a la detección de ayudas personalizadas, alertas semanales de novedades y cuestionario de perfil. Sin coste, sin tarjeta de crédito.</li>
              <li><strong>Plan Gestoría Starter (149€/mes + IVA):</strong> acceso profesional para gestión de hasta 50 clientes activos, informes individuales y alertas automáticas por cliente.</li>
              <li><strong>Plan Gestoría Pro (399€/mes + IVA):</strong> clientes ilimitados, todas las funcionalidades del plan Starter, panel multi-cliente y soporte prioritario.</li>
            </ul>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              Los precios pueden ser modificados con un preaviso mínimo de 30 días a los usuarios con suscripción activa.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>4. Suscripciones y facturación</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Las suscripciones de pago se renuevan automáticamente cada mes en la fecha de contratación. El pago se procesa a través de Stripe, plataforma certificada PCI-DSS. Cóbratelo.es no almacena datos de tarjeta bancaria.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              El usuario puede cancelar su suscripción en cualquier momento desde su panel de cuenta o enviando un email a <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a>. La cancelación tiene efecto al finalizar el período ya facturado. No se realizan devoluciones de períodos ya abonados, salvo error imputable al servicio.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>5. Obligaciones del usuario</h2>
            <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 8 }}>El usuario se compromete a:</p>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li>Facilitar información veraz y actualizada en su perfil.</li>
              <li>No usar el servicio para fines ilícitos o contrarios a estos términos.</li>
              <li>No intentar acceder a datos de otros usuarios ni vulnerar la seguridad del sistema.</li>
              <li>No reproducir, distribuir ni comercializar el contenido del servicio sin autorización expresa.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>6. Limitación de responsabilidad</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Cóbratelo.es no se responsabiliza de las decisiones tomadas por el usuario basándose en la información proporcionada, de los resultados obtenidos en procesos de solicitud de ayudas, ni de la disponibilidad ininterrumpida del servicio. El servicio se presta "tal cual" y sin garantía de resultados.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>7. Modificaciones del servicio</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Cóbratelo.es se reserva el derecho de modificar, suspender o discontinuar el servicio o cualquiera de sus funcionalidades, con o sin previo aviso, salvo en lo relativo a cambios de precio que afecten a suscripciones activas, donde se respetará el preaviso de 30 días.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>8. Ley aplicable y jurisdicción</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Estos términos se rigen por la legislación española. Para cualquier controversia derivada del uso del servicio, las partes se someten a los juzgados y tribunales de Barcelona, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }}>9. Contacto</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Para cualquier consulta sobre estos términos puedes contactar en <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a>.
            </p>
          </section>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #F5C89A', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/aviso-legal" style={{ color: '#cc5500', textDecoration: 'none' }}>Aviso Legal</Link>
            <Link href="/privacidad" style={{ color: '#cc5500', textDecoration: 'none' }}>Política de Privacidad</Link>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  )
}
