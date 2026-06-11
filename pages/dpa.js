import Head from 'next/head'
import Link from 'next/link'

const s = { section: { marginBottom: 32 }, h2: { fontSize: 18, fontWeight: 700, color: '#1a0d00', marginBottom: 12 }, p: { color: '#444', lineHeight: 1.8, marginBottom: 12 }, ul: { color: '#444', lineHeight: 2, paddingLeft: 20 } }

export default function DPA() {
  return (
    <>
      <Head><title>Acuerdo de Colaboración y Comunicación de Datos para Gestorías — Cóbratelo.es</title><meta name="robots" content="noindex" /></Head>
      <div style={{ background: '#FFE2C4', minHeight: '100vh', padding: '0 0 64px' }}>
        <nav style={{ background: '#1a0d00', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a0d00', marginBottom: 8 }}>Acuerdo de Colaboración y Comunicación de Datos para Gestorías</h1>
          <p style={{ color: '#666', marginBottom: 4, fontSize: 15 }}>Condiciones de Acceso, Comunicación y Tratamiento de Datos entre Responsables Independientes — Art. 6.1.a y Art. 26 RGPD</p>
          <p style={{ color: '#888', marginBottom: 8 }}>Última actualización: junio 2026</p>
          <p style={{ color: '#cc5500', marginBottom: 40, fontStyle: 'italic', fontSize: 14 }}>Borrador pendiente de revisión legal. No tiene validez contractual hasta su aprobación definitiva.</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Arquitectura jurídica del tratamiento</h2>
            <p style={s.p}><strong>Cóbratelo.es</strong> (titular: Miquel Nogueras Camero, NIF 77609795K) actúa como <strong>responsable del tratamiento</strong> respecto a los datos que recoge directamente de sus usuarios en el marco del funcionamiento de la plataforma: registro de usuarios, cuentas, matching de ayudas, preferencias, consentimientos, suscripciones, facturación, soporte y funcionamiento técnico.</p>
            <p style={s.p}><strong>La gestoría</strong> que contrata un plan profesional actúa como <strong>responsable independiente del tratamiento</strong> respecto de los datos que gestiona en el ejercicio de su actividad profesional propia: sus clientes, los expedientes que tramita, la documentación aportada, las solicitudes de ayudas, la relación profesional con sus clientes y las obligaciones legales de conservación que le son propias.</p>
            <p style={s.p}><strong>Ninguna de las partes actúa como encargada del tratamiento de la otra.</strong> Cada parte es responsable autónoma e independiente de los tratamientos que realiza en el ámbito de sus respectivas actividades.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Mecanismo de comunicación de datos</h2>
            <p style={s.p}>Cuando un ciudadano usuario de Cóbratelo.es solicita los servicios de una gestoría a través de la plataforma, otorga <strong>consentimiento expreso, libre, específico, informado e inequívoco</strong> para que Cóbratelo.es comunique sus datos personales y perfil de ayudas a la gestoría elegida.</p>
            <p style={s.p}>El texto de consentimiento que acepta el ciudadano es el siguiente:</p>
            <div style={{ background: '#fff8f2', border: '1px solid #ffccaa', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ color: '#444', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                "Autorizo expresamente a Cóbratelo.es a comunicar mis datos personales y la información necesaria de mi expediente a la gestoría seleccionada, para que pueda contactarme y prestarme servicios profesionales relacionados con la gestión de ayudas y subvenciones."
              </p>
            </div>
            <p style={s.p}>Cóbratelo.es registra de cada consentimiento: fecha, hora, dirección IP del ciudadano, gestoría seleccionada y versión del texto legal aceptado.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Efectos de la comunicación</h2>
            <p style={s.p}>Tras la comunicación autorizada, la gestoría receptora pasa a ser responsable independiente del tratamiento de los datos recibidos en el marco de su actividad profesional. A partir de ese momento:</p>
            <ul style={s.ul}>
              <li>La gestoría debe informar al ciudadano sobre el tratamiento que realiza de sus datos.</li>
              <li>La gestoría debe atender el ejercicio de derechos RGPD que el ciudadano le dirija directamente.</li>
              <li>Cóbratelo.es no es responsable de los tratamientos que la gestoría realice fuera de la plataforma.</li>
              <li>La relación entre el ciudadano y la gestoría es exclusivamente profesional, independiente de Cóbratelo.es.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Obligaciones de la gestoría como responsable independiente</h2>
            <p style={s.p}>La gestoría se compromete a:</p>
            <ul style={s.ul}>
              <li>Tratar los datos comunicados únicamente para la finalidad autorizada por el ciudadano.</li>
              <li>Cumplir todos los principios del RGPD aplicables a los responsables del tratamiento (licitud, lealtad, transparencia, limitación de finalidad, minimización, exactitud, integridad y confidencialidad).</li>
              <li>Aplicar medidas técnicas y organizativas adecuadas para garantizar la seguridad de los datos recibidos.</li>
              <li>No comunicar los datos a terceros sin base legal suficiente.</li>
              <li>Notificar a la AEPD cualquier brecha de seguridad que afecte a estos datos en el plazo de 72 horas.</li>
              <li>Disponer de su propia política de privacidad que informe a los ciudadanos-clientes sobre el tratamiento que realiza.</li>
              <li>Cumplir con los plazos de conservación aplicables a su actividad profesional.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Obligaciones de Cóbratelo.es</h2>
            <ul style={s.ul}>
              <li>Verificar la existencia del consentimiento antes de comunicar datos a la gestoría.</li>
              <li>Conservar el registro de consentimientos durante el plazo de prescripción aplicable.</li>
              <li>Retirar el acceso de la gestoría a los datos del ciudadano en la plataforma si este revoca su consentimiento.</li>
              <li>Garantizar la segregación técnica entre gestorías (ninguna gestoría accede a datos de clientes de otra).</li>
              <li>Informar a las gestorías de las revocaciones de consentimiento que afecten a sus clientes activos.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Revocación del consentimiento</h2>
            <p style={s.p}>El ciudadano puede revocar su consentimiento en cualquier momento desde su panel de cuenta. La revocación impide nuevos accesos de la gestoría a los datos del ciudadano en Cóbratelo.es, pero no afecta retroactivamente a los tratamientos ya realizados por la gestoría fuera de la plataforma, de los que esta es responsable independiente.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Fin de la relación contractual</h2>
            <p style={s.p}>Al cancelar o resolver el contrato de servicio, la gestoría pierde el acceso a los datos de los ciudadanos almacenados en Cóbratelo.es. Los datos que la gestoría hubiera tratado en el marco de su actividad profesional son de su responsabilidad exclusiva y se rigen por la normativa aplicable a dicha actividad.</p>
            <p style={s.p}>La gestoría puede solicitar la exportación de sus expedientes durante los 30 días posteriores a la baja.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Responsabilidad</h2>
            <p style={s.p}>Cada parte responde exclusivamente de los tratamientos que realiza en el ámbito de su propia actividad. Cóbratelo.es no responde por los tratamientos realizados por las gestorías fuera de la plataforma, ni por los resultados profesionales obtenidos por estas en la gestión de expedientes.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Base legitimadora y garantía de indemnidad</h2>
            <p style={s.p}>La gestoría garantiza que dispone de una base legitimadora válida bajo el RGPD para todos los tratamientos de datos personales que realiza en el ejercicio de su actividad profesional, incluyendo los datos recibidos a través de Cóbratelo.es.</p>
            <p style={s.p}>La gestoría mantendrá indemne a Cóbratelo.es frente a cualquier reclamación, sanción, procedimiento o responsabilidad que derive del incumplimiento por parte de la gestoría de sus obligaciones legales o en materia de protección de datos, incluyendo las derivadas de su actuación como responsable independiente del tratamiento.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Categorías especiales de datos</h2>
            <p style={s.p}>Con carácter general, este acuerdo no contempla el tratamiento de categorías especiales de datos en el sentido del artículo 9 RGPD. No obstante, determinadas ayudas y subvenciones pueden requerir información relativa a discapacidad, dependencia, estado de salud o situación de vulnerabilidad. En estos casos, la gestoría deberá obtener el consentimiento explícito del ciudadano afectado y garantizar las medidas de seguridad reforzadas exigidas por el RGPD para este tipo de datos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Aceptación</h2>
            <p style={s.p}>La contratación de cualquier plan profesional de Cóbratelo.es implica la lectura, comprensión y aceptación íntegra del presente Acuerdo.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Legislación aplicable</h2>
            <p style={s.p}>RGPD (UE) 2016/679, LOPDGDD (LO 3/2018) y demás normativa española de protección de datos. Juzgados de Barcelona.</p>
          </section>
        </div>
      </div>
    </>
  )
}
