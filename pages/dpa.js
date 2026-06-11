import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function DPA() {
  return (
    <>
      <Head>
        <title>Acuerdo de Encargo de Tratamiento (DPA) — Cóbratelo.es</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Acuerdo de Encargo de Tratamiento</h1>
          <p style={{ color: '#666', marginBottom: 4, fontSize: 15 }}>Data Processing Agreement (DPA) — Art. 28 RGPD</p>
          <p style={{ color: '#888', marginBottom: 8 }}>Última actualización: junio 2026</p>
          <p style={{ color: '#cc5500', marginBottom: 40, fontStyle: 'italic', fontSize: 14 }}>
            Borrador pendiente de revisión legal. No tiene validez contractual hasta su aprobación y publicación definitiva.
          </p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Partes e identificación de roles</h2>
            <p style={s.p}>
              <strong>Responsable del tratamiento:</strong> Miquel Nogueras Camero (NIF 77609795K), titular de Cóbratelo.es — en adelante, el Responsable.
            </p>
            <p style={s.p}>
              <strong>Encargado del tratamiento:</strong> la gestoría o profesional que contrata un plan profesional de Cóbratelo.es — en adelante, el Encargado.
            </p>
            <p style={s.p}>
              De conformidad con el artículo 28 del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), la contratación de un plan profesional de Cóbratelo.es implica la aceptación íntegra del presente acuerdo.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Objeto del encargo</h2>
            <p style={s.p}>
              El Responsable encarga al Encargado el tratamiento de datos personales de ciudadanos usuarios de Cóbratelo.es que hayan autorizado expresamente el acceso de dicho Encargado a su perfil, con la finalidad exclusiva de prestarles servicios profesionales de gestión y tramitación de ayudas públicas.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Datos objeto del tratamiento</h2>
            <ul style={s.ul}>
              <li><strong>Categorías de datos:</strong> datos identificativos (nombre, email), datos de situación personal y profesional (edad, situación laboral, nivel de ingresos, composición familiar, comunidad autónoma), datos relativos a expedientes de ayudas y subvenciones.</li>
              <li><strong>Categorías de interesados:</strong> ciudadanos usuarios de Cóbratelo.es que han otorgado consentimiento expreso para que el Encargado acceda a su información.</li>
              <li><strong>No se tratan categorías especiales de datos</strong> en el sentido del artículo 9 RGPD.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Obligaciones del Encargado</h2>
            <p style={s.p}>El Encargado se compromete a:</p>
            <ul style={s.ul}>
              <li>Tratar los datos únicamente conforme a las instrucciones del Responsable y para la finalidad descrita en este acuerdo. No utilizará los datos para finalidades propias o distintas sin autorización expresa.</li>
              <li>Garantizar la confidencialidad de los datos, exigiendo el mismo compromiso al personal que acceda a ellos.</li>
              <li>Implementar las medidas técnicas y organizativas adecuadas para garantizar la seguridad de los datos, conforme al artículo 32 RGPD.</li>
              <li>No subcontratar el tratamiento de datos con terceros sin autorización previa y por escrito del Responsable. En caso de subcontratación autorizada, el Encargado responderá solidariamente.</li>
              <li>Asistir al Responsable en la atención de solicitudes de ejercicio de derechos por parte de los interesados (acceso, rectificación, supresión, portabilidad, oposición).</li>
              <li>Notificar al Responsable, sin dilación indebida y en un plazo máximo de 72 horas, cualquier brecha de seguridad que afecte a los datos tratados.</li>
              <li>Colaborar con el Responsable en la realización de evaluaciones de impacto si fueran necesarias.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Subencargados técnicos del Responsable</h2>
            <p style={s.p}>El Responsable utiliza los siguientes subencargados para la prestación del servicio, todos con garantías RGPD adecuadas:</p>
            <ul style={s.ul}>
              <li><strong>Supabase Inc.</strong> — base de datos e infraestructura (servidores en la UE)</li>
              <li><strong>Vercel Inc.</strong> — infraestructura web y despliegue</li>
              <li><strong>Stripe Inc.</strong> — procesamiento de pagos (certificado PCI-DSS)</li>
              <li><strong>Forward Email</strong> — comunicaciones transaccionales por email</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Derechos de los interesados</h2>
            <p style={s.p}>
              Cuando un ciudadano ejerza sus derechos ante el Encargado, este deberá comunicárselo al Responsable (hola@cobratelo.es) en el plazo de 5 días hábiles para que el Responsable pueda dar respuesta en los plazos legales.
            </p>
            <p style={s.p}>
              El Encargado no dará respuesta directa a las solicitudes de derechos sin instrucción previa del Responsable, salvo cuando sea legalmente obligatorio.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Duración y devolución de datos</h2>
            <p style={s.p}>
              Este acuerdo tendrá la misma duración que el contrato de servicio entre las partes. A la finalización o resolución del contrato, el Encargado:
            </p>
            <ul style={s.ul}>
              <li>Dejará de acceder a los datos de ciudadanos en la plataforma de Cóbratelo.es de forma inmediata.</li>
              <li>Destruirá o devolverá al Responsable, según se acuerde, cualquier copia de datos personales que pudiera conservar fuera de la plataforma.</li>
              <li>Certificará por escrito la destrucción de los datos si así lo requiere el Responsable.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Auditoría y cooperación</h2>
            <p style={s.p}>
              El Encargado permitirá y cooperará activamente en las auditorías e inspecciones relativas al cumplimiento de este acuerdo que el Responsable o sus representantes autorizados consideren necesarias, con preaviso razonable.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Responsabilidad</h2>
            <p style={s.p}>
              El Encargado responderá de los daños causados por el tratamiento si ha actuado de forma contraria a las instrucciones del Responsable o al presente acuerdo. El Responsable responderá de los daños causados si no ha cumplido las obligaciones del RGPD específicamente dirigidas a los responsables.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Legislación aplicable</h2>
            <p style={s.p}>
              Este acuerdo se rige por el RGPD (UE) 2016/679, la LOPDGDD (LO 3/2018) y demás normativa española de protección de datos aplicable. Para cualquier controversia, las partes se someten a los juzgados de Barcelona.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Aceptación</h2>
            <p style={s.p}>
              La contratación de cualquier plan profesional de Cóbratelo.es implica la lectura, comprensión y aceptación íntegra del presente Acuerdo de Encargo de Tratamiento.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
