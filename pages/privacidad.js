import Head from 'next/head'
import Link from 'next/link'

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#f7f3ec', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#111110', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111110', marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: mayo 2026</p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>1. Responsable del tratamiento</h2>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Responsable:</strong> Miquel Nogueras Camero</li>
              <li><strong>NIF:</strong> 77609795K</li>
              <li><strong>Email:</strong> <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a></li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>2. Datos que recogemos</h2>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Datos de registro:</strong> dirección de email para crear y gestionar tu cuenta.</li>
              <li><strong>Datos de perfil:</strong> información sobre tu situación personal y profesional que facilitas voluntariamente para recibir resultados personalizados (edad, situación laboral, comunidad autónoma, ingresos aproximados, etc.).</li>
              <li><strong>Datos de uso:</strong> páginas visitadas, interacciones con el servicio, con fines de mejora y análisis agregado.</li>
              <li><strong>Datos de facturación:</strong> en el caso de suscripciones de pago, gestionados exclusivamente a través de Stripe. Cóbratelo.es no almacena datos bancarios ni de tarjeta.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>3. Finalidad y base legal</h2>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Prestación del servicio</strong> — base legal: ejecución de contrato (Art. 6.1.b RGPD)</li>
              <li><strong>Envío de alertas y comunicaciones sobre ayudas</strong> — base legal: consentimiento (Art. 6.1.a RGPD)</li>
              <li><strong>Mejora del servicio y análisis estadístico</strong> — base legal: interés legítimo (Art. 6.1.f RGPD)</li>
              <li><strong>Cumplimiento de obligaciones legales</strong> — base legal: obligación legal (Art. 6.1.c RGPD)</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>4. Conservación de datos</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Los datos se conservan mientras el usuario mantenga su cuenta activa. Tras la eliminación de la cuenta, los datos se eliminan en un plazo máximo de 30 días, salvo aquellos que deban conservarse por obligación legal (hasta 6 años para datos fiscales).
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>5. Terceros que acceden a tus datos</h2>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Supabase</strong> — base de datos y autenticación (servidores en UE)</li>
              <li><strong>Stripe</strong> — procesamiento de pagos (certificado PCI-DSS)</li>
              <li><strong>Vercel</strong> — infraestructura web</li>
              <li><strong>Forward Email</strong> — envío de correos transaccionales</li>
            </ul>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              Todos los proveedores cuentan con garantías adecuadas de protección de datos conforme al RGPD.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>6. Tus derechos</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Puedes ejercer los derechos de acceso, rectificación, supresión, portabilidad, limitación u oposición al tratamiento enviando un email a <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a> con el asunto "Derechos RGPD" y una copia de tu documento de identidad.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              Si consideras que tus derechos no han sido atendidos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener" style={{ color: '#cc5500' }}>aepd.es</a>).
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>7. Cookies</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Utilizamos cookies estrictamente necesarias para el funcionamiento del servicio (sesión de usuario). No utilizamos cookies de publicidad ni de seguimiento de terceros sin consentimiento previo.
            </p>
          </section>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e0dad0', display: 'flex', gap: 24 }}>
            <Link href="/aviso-legal" style={{ color: '#cc5500', textDecoration: 'none' }}>Aviso Legal</Link>
            <Link href="/terminos" style={{ color: '#cc5500', textDecoration: 'none' }}>Términos de Uso</Link>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  )
}
