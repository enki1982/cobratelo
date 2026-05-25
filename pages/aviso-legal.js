import Head from 'next/head'
import Link from 'next/link'

export default function AvisoLegal() {
  return (
    <>
      <Head>
        <title>Aviso Legal — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#f7f3ec', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#111110', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#00e87a' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111110', marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: mayo 2026</p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>1. Titular del sitio web</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI), se facilitan los siguientes datos:
            </p>
            <ul style={{ color: '#444', lineHeight: 2, marginTop: 12, paddingLeft: 20 }}>
              <li><strong>Titular:</strong> Miquel Nogueras Camero</li>
              <li><strong>NIF:</strong> 77609795K</li>
              <li><strong>Domicilio:</strong> Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona)</li>
              <li><strong>Email de contacto:</strong> <a href="mailto:hola@cobratelo.es" style={{ color: '#2d6a4f' }}>hola@cobratelo.es</a></li>
              <li><strong>Sitio web:</strong> cobratelo.es</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>2. Objeto y naturaleza del servicio</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Cóbratelo.es es una plataforma digital de carácter informativo que facilita a sus usuarios la detección de ayudas, subvenciones y prestaciones públicas disponibles en España en función de su perfil personal y profesional.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              El servicio tiene carácter <strong>exclusivamente informativo</strong>. Cóbratelo.es no actúa como gestoría, asesoría ni representante legal del usuario ante ninguna administración pública. La tramitación de cualquier ayuda es responsabilidad exclusiva del usuario o del profesional que este designe.
            </p>
            <p style={{ color: '#444', lineHeight: 1.7, marginTop: 12 }}>
              La información proporcionada se obtiene de fuentes públicas oficiales y tiene carácter orientativo. Cóbratelo.es no garantiza la exactitud, vigencia o disponibilidad de las convocatorias mostradas. El usuario debe verificar siempre la información en la fuente oficial correspondiente.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>3. Propiedad intelectual</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Todos los contenidos de este sitio web, incluyendo textos, imágenes, diseño, código fuente y logotipos propios, son propiedad de Miquel Nogueras Camero o de sus respectivos titulares, y están protegidos por la normativa española e internacional de propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización expresa.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>4. Limitación de responsabilidad</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Cóbratelo.es no se responsabiliza de las decisiones tomadas por el usuario basándose en la información proporcionada, ni de los resultados obtenidos en procesos de solicitud de ayudas ante las administraciones públicas. El uso del servicio es bajo la exclusiva responsabilidad del usuario.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111110', marginBottom: 12 }}>5. Legislación aplicable</h2>
            <p style={{ color: '#444', lineHeight: 1.7 }}>
              Este aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso del sitio web, las partes se someten a los juzgados y tribunales de Barcelona, con renuncia a cualquier otro fuero.
            </p>
          </section>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e0dad0', display: 'flex', gap: 24 }}>
            <Link href="/privacidad" style={{ color: '#2d6a4f', textDecoration: 'none' }}>Política de Privacidad</Link>
            <Link href="/terminos" style={{ color: '#2d6a4f', textDecoration: 'none' }}>Términos de Uso</Link>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  )
}
