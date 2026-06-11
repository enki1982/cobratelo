import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function DPA() {
  return (
    <>
      <Head><title>Condiciones de acceso a datos — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Condiciones de Acceso a Datos para Gestorías</h1>
          <p style={{ color: '#666', marginBottom: 4, fontSize: 15 }}>Cesión de datos entre responsables independientes — Art. 6.1.a RGPD</p>
          <p style={{ color: '#888', marginBottom: 8 }}>Última actualización: junio 2026</p>
          <p style={{ color: '#cc5500', marginBottom: 40, fontStyle: 'italic', fontSize: 14 }}>Borrador pendiente de revisión legal. No tiene validez contractual hasta su aprobación definitiva.</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Modelo de responsabilidad</h2>
            <p style={s.p}>Cóbratelo.es actúa como <strong>responsable del tratamiento</strong> de los datos que recoge directamente de sus usuarios ciudadanos.</p>
            <p style={s.p}>Cuando un ciudadano otorga consentimiento expreso para que una gestoría acceda a sus datos, Cóbratelo.es realiza una <strong>cesión de datos a un responsable independiente</strong>: la gestoría receptora pasa a ser responsable autónoma del tratamiento de esos datos en el marco de su actividad profesional propia.</p>
            <p style={s.p}>Esta cesión se fundamenta en el consentimiento libre, informado, específico e inequívoco del ciudadano interesado (Art. 6.1.a RGPD). La gestoría no actúa como encargada del tratamiento de Cóbratelo.es.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Datos objeto de la cesión</h2>
            <ul style={s.ul}>
              <li><strong>Datos cedidos:</strong> email, perfil personal y profesional del ciudadano (edad, situación laboral, ingresos aproximados, composición familiar, comunidad autónoma), listado de ayudas identificadas como relevantes para su perfil, y expedientes creados en la plataforma.</li>
              <li><strong>No se ceden:</strong> datos de pago ni datos de otros ciudadanos que no hayan autorizado expresamente el acceso de esa gestoría.</li>
              <li><strong>Categorías especiales:</strong> no se tratan datos de categorías especiales (Art. 9 RGPD) sin consentimiento explícito adicional.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Finalidad de la cesión</h2>
            <p style={s.p}>La cesión tiene como finalidad exclusiva permitir a la gestoría prestar servicios profesionales de gestión y tramitación de ayudas públicas al ciudadano que lo ha solicitado. La gestoría no puede utilizar los datos cedidos para finalidades distintas a las aceptadas por el ciudadano.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Responsabilidades de la gestoría como responsable independiente</h2>
            <p style={s.p}>Al acceder a los datos cedidos, la gestoría asume plenamente las responsabilidades de responsable del tratamiento bajo el RGPD y la LOPDGDD, incluyendo:</p>
            <ul style={s.ul}>
              <li>Respetar los principios de licitud, lealtad, transparencia, limitación de finalidad y minimización de datos.</li>
              <li>Informar al ciudadano sobre el tratamiento que realiza de sus datos y su propia política de privacidad.</li>
              <li>Atender el ejercicio de derechos (acceso, rectificación, supresión, etc.) que el ciudadano dirija directamente a la gestoría.</li>
              <li>Implementar medidas técnicas y organizativas adecuadas para garantizar la seguridad de los datos recibidos.</li>
              <li>Notificar a la Agencia Española de Protección de Datos las brechas de seguridad que afecten a los datos en el plazo legal de 72 horas.</li>
              <li>No ceder los datos a terceros sin base legal suficiente.</li>
              <li>Cumplir con el resto de obligaciones que el RGPD impone a los responsables del tratamiento.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Consentimiento del ciudadano y revocación</h2>
            <p style={s.p}>La cesión de datos solo se produce cuando el ciudadano otorga consentimiento expreso a través de la plataforma. Cóbratelo.es registra: fecha, hora, dirección IP, texto legal aceptado y gestoría seleccionada.</p>
            <p style={s.p}>El ciudadano puede revocar su consentimiento en cualquier momento desde su panel de cuenta. La revocación impide nuevos accesos de la gestoría a sus datos en Cóbratelo.es, pero no afecta a los tratamientos ya realizados por la gestoría fuera de la plataforma, de los que la gestoría es responsable independiente.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Obligaciones de Cóbratelo.es</h2>
            <ul style={s.ul}>
              <li>Verificar la existencia del consentimiento antes de dar acceso a los datos.</li>
              <li>Mantener el registro de consentimientos durante el plazo de prescripción aplicable.</li>
              <li>Informar a las gestorías sobre revocaciones de consentimiento.</li>
              <li>Garantizar la segregación técnica entre gestorías en la plataforma.</li>
              <li>Retirar el acceso de la gestoría a los datos del ciudadano cuando este revoque su consentimiento.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Fin de la relación contractual</h2>
            <p style={s.p}>Al cancelar o resolver el contrato de servicio, la gestoría perderá el acceso a los datos de los ciudadanos almacenados en Cóbratelo.es. Los datos que la gestoría hubiera tratado fuera de la plataforma son de su responsabilidad exclusiva y no están sujetos a este acuerdo.</p>
            <p style={s.p}>La gestoría puede solicitar la exportación de los datos de sus expedientes durante los 30 días posteriores a la baja.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Infraestructura técnica</h2>
            <p style={s.p}>Los datos se almacenan en Supabase (servidores UE) con Row Level Security activado, garantizando que cada gestoría accede únicamente a sus propios datos. Las comunicaciones se protegen mediante HTTPS/TLS.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Aceptación</h2>
            <p style={s.p}>La contratación de cualquier plan profesional de Cóbratelo.es implica la lectura, comprensión y aceptación íntegra de estas condiciones.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Legislación aplicable</h2>
            <p style={s.p}>RGPD (UE) 2016/679, LOPDGDD (LO 3/2018) y demás normativa española de protección de datos. Juzgados de Barcelona.</p>
          </section>
        </div>
      </div>
    </>
  )
}
