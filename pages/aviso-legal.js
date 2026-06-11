import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function AvisoLegal() {
  return (
    <>
      <Head><title>Aviso Legal — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ color: '#888', marginBottom: 40 }}>Última actualización: junio 2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Datos identificativos del titular</h2>
            <p style={s.p}>En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI):</p>
            <ul style={s.ul}>
              <li><strong>Titular:</strong> Miquel Nogueras Camero</li>
              <li><strong>NIF:</strong> 77609795K</li>
              <li><strong>Domicilio:</strong> Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona)</li>
              <li><strong>Email:</strong> <a href="mailto:hola@cobratelo.es" style={{ color: '#cc5500' }}>hola@cobratelo.es</a></li>
              <li><strong>Sitio web:</strong> cobratelo.es</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Objeto y naturaleza del servicio</h2>
            <p style={s.p}>Cóbratelo.es es una plataforma digital SaaS española que presta dos tipos de servicios:</p>
            <ul style={s.ul}>
              <li><strong>Para ciudadanos:</strong> detección personalizada de ayudas, subvenciones y prestaciones públicas disponibles en España en función del perfil del usuario.</li>
              <li><strong>Para gestorías y profesionales:</strong> herramienta de gestión profesional (CRM) para administrar clientes, expedientes y tramitación de ayudas públicas.</li>
            </ul>
            <p style={s.p}>Cóbratelo.es no actúa como gestoría, asesoría ni representante legal del usuario ante ninguna administración pública. La tramitación de cualquier ayuda es responsabilidad exclusiva del usuario o del profesional que este designe.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Disponibilidad del servicio</h2>
            <p style={s.p}>Cóbratelo.es no garantiza la disponibilidad ininterrumpida del servicio. Pueden producirse interrupciones por:</p>
            <ul style={s.ul}>
              <li>Mantenimientos programados, que se notificarán con la mayor antelación posible.</li>
              <li>Actualizaciones técnicas o de funcionalidades.</li>
              <li>Fallos de proveedores externos de infraestructura (Vercel, Supabase, etc.).</li>
              <li>Causas de fuerza mayor o circunstancias ajenas al control del titular.</li>
            </ul>
            <p style={s.p}>El titular no será responsable por los daños derivados de dichas interrupciones, salvo lo dispuesto en la normativa aplicable.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Exactitud de la información y enlaces externos</h2>
            <p style={s.p}>La información sobre ayudas y subvenciones publicada en Cóbratelo.es procede de fuentes públicas oficiales y tiene carácter orientativo. Cóbratelo.es no garantiza su exactitud, vigencia ni disponibilidad. El usuario debe verificar siempre la información en la fuente oficial.</p>
            <p style={s.p}>Cóbratelo.es no se responsabiliza del contenido ni de la disponibilidad de los organismos externos a los que puede enlazar o de los que extrae información, incluyendo pero sin limitarse a:</p>
            <ul style={s.ul}>
              <li>Base de Datos Nacional de Subvenciones (BDNS)</li>
              <li>Seguridad Social y sus organismos dependientes</li>
              <li>Servicio Público de Empleo Estatal (SEPE)</li>
              <li>Comunidades Autónomas y sus organismos</li>
              <li>Ayuntamientos y entidades locales</li>
            </ul>
            <p style={s.p}>Los cambios en convocatorias, requisitos o plazos de estos organismos pueden no reflejarse de forma inmediata en la plataforma.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Uso prohibido</h2>
            <p style={s.p}>Queda expresamente prohibido:</p>
            <ul style={s.ul}>
              <li>El scraping, extracción masiva o automatizada de datos de la plataforma por cualquier medio técnico.</li>
              <li>El uso de bots, scripts u herramientas automatizadas para acceder, consultar o extraer información del servicio sin autorización expresa y por escrito del titular.</li>
              <li>La reproducción, redistribución o comercialización de la base de datos de ayudas o cualquier otro contenido de la plataforma.</li>
              <li>Cualquier acción que sobrecargue de forma desproporcionada la infraestructura del servicio.</li>
            </ul>
            <p style={s.p}>El incumplimiento de estas prohibiciones podrá dar lugar a la suspensión inmediata del acceso y al ejercicio de las acciones legales correspondientes.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Propiedad intelectual e industrial</h2>
            <p style={s.p}>Todos los contenidos de este sitio web, incluyendo textos, imágenes, diseño, código fuente, base de datos de ayudas, algoritmos y logotipos propios, son propiedad de Miquel Nogueras Camero o de sus respectivos titulares, y están protegidos por la normativa de propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización expresa.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Limitación de responsabilidad</h2>
            <p style={s.p}>Cóbratelo.es no se responsabiliza de las decisiones tomadas por el usuario basándose en la información proporcionada, de los resultados obtenidos en procesos de solicitud de ayudas, ni de la actuación de las gestorías o profesionales independientes que operen en la plataforma.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Legislación aplicable y jurisdicción</h2>
            <p style={s.p}>Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona.</p>
          </section>
        </div>
      </div>
    </>
  )
}
