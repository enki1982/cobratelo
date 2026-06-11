import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function ContratoSaas() {
  return (
    <>
      <Head><title>Contrato de Licencia SaaS — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Contrato de Licencia SaaS para Gestorías</h1>
          <p style={{ color: '#888', marginBottom: 8 }}>Última actualización: junio 2026</p>
          <p style={{ color: '#cc5500', marginBottom: 40, fontStyle: 'italic', fontSize: 14 }}>Borrador pendiente de revisión legal. No tiene validez contractual hasta su aprobación definitiva.</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Partes</h2>
            <p style={s.p}><strong>Proveedor:</strong> Miquel Nogueras Camero (NIF 77609795K), titular de Cóbratelo.es. Email: hola@cobratelo.es.</p>
            <p style={s.p}><strong>Cliente:</strong> la gestoría o profesional que contrata un plan profesional (Starter o Pro). La contratación implica la aceptación íntegra de este contrato.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Objeto</h2>
            <p style={s.p}>El Proveedor concede al Cliente una licencia de uso no exclusiva, intransferible y limitada para acceder y utilizar Cóbratelo.es en su modalidad profesional durante el período de vigencia del plan contratado.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Exclusión de asesoramiento</h2>
            <p style={s.p}><strong>Cóbratelo.es proporciona exclusivamente una herramienta tecnológica.</strong> El Proveedor no presta servicios de asesoramiento jurídico, fiscal, laboral, administrativo ni de ningún otro tipo.</p>
            <p style={s.p}>La información sobre ayudas y subvenciones disponible en la plataforma tiene carácter meramente informativo y no constituye asesoramiento profesional. El Cliente es el único responsable del asesoramiento que preste a sus propios clientes y de la interpretación que realice de dicha información.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Cambios normativos y actualización de convocatorias</h2>
            <p style={s.p}>Las ayudas, subvenciones y prestaciones públicas están sujetas a cambios normativos constantes. Cóbratelo.es no garantiza la actualización inmediata de las convocatorias ni la exactitud de la información en todo momento.</p>
            <p style={s.p}>El Cliente es responsable de verificar la vigencia y requisitos de cada convocatoria en las fuentes oficiales antes de iniciar cualquier tramitación. Cóbratelo.es no responde por denegaciones, sanciones, pérdidas de ayudas ni errores de tramitación derivados de información desactualizada o de decisiones del Cliente basadas en los datos de la plataforma.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Responsabilidad por ayudas</h2>
            <p style={s.p}>Cóbratelo.es no responde en ningún caso por:</p>
            <ul style={s.ul}>
              <li>La denegación de ayudas por parte de organismos públicos.</li>
              <li>Errores o retrasos en la tramitación imputables al Cliente o a sus clientes.</li>
              <li>La pérdida de ayudas por incumplimiento de plazos o requisitos.</li>
              <li>Cambios en la normativa que afecten a convocatorias en curso.</li>
              <li>Actuaciones u omisiones de organismos públicos.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Licencia de uso</h2>
            <ul style={s.ul}>
              <li>La licencia es personal e intransferible. No puede cederse ni sublicenciarse.</li>
              <li>El número de clientes gestionables depende del plan (Starter: 50; Pro: ilimitados).</li>
              <li>Está prohibida la ingeniería inversa, descompilación o acceso al código fuente.</li>
              <li>Está prohibido el scraping, extracción masiva o uso automatizado no autorizado.</li>
              <li>Está prohibida la reventa o sublicencia del acceso a terceros.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Propiedad intelectual</h2>
            <p style={s.p}>Cóbratelo.es, su código fuente, diseño, base de datos de ayudas, algoritmos y metodología son propiedad exclusiva del Proveedor. La licencia no otorga al Cliente ningún derecho de propiedad. Los datos introducidos por el Cliente son de su propiedad.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Disponibilidad y dependencia de terceros</h2>
            <p style={s.p}>El Proveedor persigue una disponibilidad objetivo del 99% mensual. Sin embargo, el servicio depende de proveedores externos cuya disponibilidad está fuera del control del Proveedor:</p>
            <ul style={s.ul}>
              <li><strong>Supabase</strong> — base de datos e infraestructura</li>
              <li><strong>Vercel</strong> — infraestructura web</li>
              <li><strong>Stripe</strong> — procesamiento de pagos</li>
              <li><strong>Forward Email</strong> — comunicaciones por email</li>
            </ul>
            <p style={s.p}>El Proveedor no será responsable de interrupciones causadas por fallos en estos proveedores. Las interrupciones no planificadas no darán derecho a compensación económica salvo acuerdo específico.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Facturación, renovación y cancelación</h2>
            <p style={s.p}>Facturación mensual anticipada vía Stripe. Renovación automática salvo cancelación desde el panel de cuenta. La cancelación surte efecto al final del período facturado, sin reembolso proporcional.</p>
            <p style={s.p}>El Proveedor puede resolver el contrato con preaviso de 30 días, o de forma inmediata por uso fraudulento, incumplimiento grave o impago.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Exportación de datos</h2>
            <p style={s.p}>El Cliente puede exportar sus datos (clientes, expedientes) en formato estándar (CSV/JSON) en cualquier momento y durante los 30 días posteriores a la cancelación. Transcurrido ese plazo, los datos podrán eliminarse.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Limitación de responsabilidad</h2>
            <p style={s.p}>La responsabilidad máxima del Proveedor se limita al importe abonado en los 3 meses anteriores al hecho causante. No se responde por lucro cesante, pérdida de datos imputable al Cliente ni daños indirectos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Soporte técnico</h2>
            <p style={s.p}>Email: hola@cobratelo.es. Pro: respuesta objetivo 24 h laborables. Starter: 72 h laborables.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>13. Fuerza mayor</h2>
            <p style={s.p}>Ninguna de las partes será responsable por incumplimientos debidos a causas fuera de su control razonable: fallos de infraestructura de terceros, ciberataques, decisiones administrativas, catástrofes u otras causas de fuerza mayor.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>14. Independencia en el tratamiento de datos</h2>
            <p style={s.p}>Las partes reconocen expresamente que cada una actúa como <strong>responsable independiente</strong> respecto de los tratamientos de datos que realiza en el ámbito de sus respectivas actividades. La utilización de la plataforma no implica que Cóbratelo.es determine las finalidades ni los medios de los tratamientos realizados por la gestoría en la prestación de sus servicios profesionales.</p>
            <p style={s.p}>La comunicación de datos de ciudadanos a la gestoría se rige por el <Link href="/dpa" style={{ color: '#cc5500' }}>Acuerdo de Comunicación de Datos entre Responsables Independientes</Link>, que forma parte integrante de este contrato.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>15. Cumplimiento normativo y garantía de indemnidad</h2>
            <p style={s.p}>La gestoría garantiza que dispone de las autorizaciones, habilitaciones y bases legitimadoras necesarias para el tratamiento de los datos personales de sus clientes en el ejercicio de su actividad profesional, y que cumple con toda la normativa aplicable a dicha actividad.</p>
            <p style={s.p}>La gestoría mantendrá indemne a Cóbratelo.es frente a cualquier reclamación, sanción, procedimiento administrativo o judicial, o responsabilidad de cualquier índole que derive del incumplimiento por parte de la gestoría de sus obligaciones legales, profesionales o en materia de protección de datos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>16. Legislación y jurisdicción</h2>
            <p style={s.p}>Legislación española. Cuando la normativa aplicable lo permita, las partes se someten a los Juzgados y Tribunales de Barcelona.</p>
          </section>
        </div>
      </div>
    </>
  )
}
