import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 } }

export default function AvisoLegal() {
  return (
    <>
      <Head>
        <title>Aviso Legal — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: junio 2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Datos identificativos del titular</h2>
            <p style={s.p}>En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI), se facilitan los siguientes datos:</p>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Titular:</strong> Miquel Nogueras Camero</li>
              <li><strong>NIF:</strong> 77609795K</li>
              <li><strong>Domicilio:</strong> Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona)</li>
              <li><strong>Email:</strong> <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a></li>
              <li><strong>Sitio web:</strong> cobratelo.es</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Objeto y naturaleza del servicio</h2>
            <p style={s.p}>
              Cóbratelo.es es una plataforma digital SaaS española que presta dos tipos de servicios:
            </p>
            <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Servicio para ciudadanos:</strong> detección personalizada de ayudas, subvenciones y prestaciones públicas disponibles en España en función del perfil del usuario.</li>
              <li><strong>Servicio para gestorías y profesionales:</strong> herramienta de gestión profesional (CRM) que permite a gestorías administrar clientes, expedientes y la tramitación de ayudas públicas.</li>
            </ul>
            <p style={s.p}>
              Cóbratelo.es no actúa como gestoría, asesoría ni representante legal del usuario ante ninguna administración pública. La tramitación de cualquier ayuda es responsabilidad exclusiva del usuario o del profesional que este designe. La información proporcionada procede de fuentes públicas oficiales y tiene carácter orientativo.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Propiedad intelectual e industrial</h2>
            <p style={s.p}>
              Todos los contenidos de este sitio web, incluyendo textos, imágenes, diseño, código fuente y logotipos propios, son propiedad de Miquel Nogueras Camero o de sus respectivos titulares, y están protegidos por la normativa española e internacional de propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización expresa.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Limitación de responsabilidad</h2>
            <p style={s.p}>
              Cóbratelo.es no se responsabiliza de las decisiones tomadas por el usuario basándose en la información proporcionada, ni de los resultados obtenidos en procesos de solicitud de ayudas ante las administraciones públicas. La exactitud, vigencia y disponibilidad de las convocatorias mostradas debe verificarse en la fuente oficial correspondiente.
            </p>
            <p style={s.p}>
              Respecto al servicio para gestorías, Cóbratelo.es actúa exclusivamente como proveedor tecnológico. La responsabilidad sobre los servicios profesionales prestados por las gestorías a sus clientes recae íntegramente en cada gestoría, que actúa de forma independiente.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Legislación aplicable y jurisdicción</h2>
            <p style={s.p}>
              Este aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso del sitio web, las partes se someten a los juzgados y tribunales de Barcelona, con renuncia a cualquier otro fuero.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
