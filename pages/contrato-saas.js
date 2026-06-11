import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function ContratoSaas() {
  return (
    <>
      <Head>
        <title>Contrato de Licencia SaaS — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Contrato de Licencia SaaS para Gestorías</h1>
          <p style={{ color: '#888', marginBottom: 8 }}>Última actualización: junio 2026</p>
          <p style={{ color: '#cc5500', marginBottom: 40, fontStyle: 'italic', fontSize: 14 }}>
            Borrador pendiente de revisión legal. No tiene validez contractual hasta su aprobación y publicación definitiva.
          </p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Partes</h2>
            <p style={s.p}>
              <strong>Proveedor:</strong> Miquel Nogueras Camero (NIF 77609795K), titular de Cóbratelo.es, con domicilio en Carrer del Roser, 21 — 08185 Lliçà de Vall (Barcelona). Email: hola@cobratelo.es.
            </p>
            <p style={s.p}>
              <strong>Cliente:</strong> la persona física o jurídica que contrata un plan profesional (Starter o Pro) de Cóbratelo.es, identificada en el momento del alta. La contratación de cualquier plan de pago implica la aceptación íntegra de este contrato.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Objeto</h2>
            <p style={s.p}>
              El Proveedor concede al Cliente una licencia de uso no exclusiva, intransferible y limitada para acceder y utilizar la plataforma Cóbratelo.es en su modalidad profesional, durante el período de vigencia del plan contratado y para el uso interno de su actividad profesional.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Licencia de uso</h2>
            <ul style={s.ul}>
              <li>La licencia es personal e intransferible. No puede cederse a terceros ni sublicenciarse.</li>
              <li>El número de usuarios y clientes gestionables depende del plan contratado (Starter: hasta 50 clientes activos; Pro: ilimitados).</li>
              <li>El Cliente no puede usar la plataforma para prestar servicios a terceros bajo marca propia sin acuerdo expreso con el Proveedor.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Propiedad intelectual</h2>
            <p style={s.p}>
              Cóbratelo.es, su código fuente, diseño, base de datos de ayudas, algoritmos y metodología son propiedad exclusiva del Proveedor y están protegidos por la normativa de propiedad intelectual. La licencia de uso no otorga al Cliente ningún derecho de propiedad sobre la plataforma.
            </p>
            <p style={s.p}>
              Los datos introducidos por el Cliente (información de sus clientes, expedientes, notas) son propiedad del Cliente. El Proveedor únicamente los trata según lo establecido en el Acuerdo de Encargo de Tratamiento.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Disponibilidad del servicio</h2>
            <p style={s.p}>
              El Proveedor se compromete a una disponibilidad objetivo del 99% mensual, excluidos mantenimientos programados notificados con antelación y causas de fuerza mayor. Las interrupciones no planificadas no darán derecho a compensación económica salvo acuerdo específico.
            </p>
            <p style={s.p}>
              El Proveedor podrá realizar cambios en la plataforma para mejorar el servicio, sin que esto constituya incumplimiento contractual, siempre que no se eliminen funcionalidades esenciales del plan contratado.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Facturación, renovación y cancelación</h2>
            <p style={s.p}>
              El servicio se factura mensualmente de forma anticipada mediante pago recurrente a través de Stripe. La suscripción se renueva automáticamente cada mes salvo cancelación expresa del Cliente.
            </p>
            <p style={s.p}>
              El Cliente puede cancelar en cualquier momento desde su panel de cuenta. La cancelación surte efecto al final del período facturado en curso, sin derecho a reembolso proporcional.
            </p>
            <p style={s.p}>
              El Proveedor puede resolver el contrato con preaviso de 30 días, o de forma inmediata en caso de uso fraudulento, incumplimiento grave o impago reiterado.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Exportación de datos</h2>
            <p style={s.p}>
              El Cliente podrá solicitar la exportación de sus datos (clientes, expedientes) en formato estándar (CSV/JSON) en cualquier momento y durante los 30 días posteriores a la cancelación. Transcurrido ese plazo, los datos podrán ser eliminados de los servidores.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Uso prohibido</h2>
            <ul style={s.ul}>
              <li>Ingeniería inversa, descompilación o intento de acceder al código fuente de la plataforma.</li>
              <li>Uso automatizado masivo de la plataforma (scraping, bots) sin autorización expresa.</li>
              <li>Reventa o sublicencia del acceso a la plataforma a terceros.</li>
              <li>Uso para actividades ilícitas o contrarias a la normativa aplicable.</li>
              <li>Acceso no autorizado a datos de otros usuarios o clientes de otras gestorías.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Limitación de responsabilidad</h2>
            <p style={s.p}>
              La responsabilidad máxima del Proveedor frente al Cliente por cualquier causa quedará limitada al importe abonado por el Cliente en los 3 meses anteriores al hecho causante. El Proveedor no será responsable de lucro cesante, pérdida de datos imputable al Cliente, ni daños indirectos.
            </p>
            <p style={s.p}>
              El Cliente es el único responsable de los servicios profesionales que presta a sus propios clientes y de la exactitud de los datos que introduce en la plataforma.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Soporte técnico</h2>
            <p style={s.p}>
              El soporte técnico se presta por email a través de hola@cobratelo.es. El plan Pro incluye soporte prioritario con tiempo de respuesta objetivo de 24 horas en días laborables. El plan Starter tiene soporte estándar con tiempo de respuesta objetivo de 72 horas.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Protección de datos</h2>
            <p style={s.p}>
              El tratamiento de datos personales en el marco de este contrato se rige por el Acuerdo de Encargo de Tratamiento (DPA) disponible en <Link href="/dpa" style={{ color: '#cc5500' }}>cobratelo.es/dpa</Link>, que forma parte integrante del presente contrato.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Modificaciones del contrato</h2>
            <p style={s.p}>
              El Proveedor podrá modificar este contrato con un preaviso de 30 días. Si el Cliente no acepta los nuevos términos, podrá resolver el contrato sin penalización antes de la entrada en vigor de los cambios.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>13. Legislación y jurisdicción</h2>
            <p style={s.p}>
              Este contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona, con renuncia expresa a cualquier otro fuero.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
