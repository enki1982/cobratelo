import Head from 'next/head'
import Link from 'next/link'

export default function Privacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad — Cóbratelo</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pb-20 prose prose-sm">
          <h1 className="font-display text-4xl font-bold text-[#111110] mb-8">Política de Privacidad</h1>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>Miquel Nogueras Ferrer</strong> (Volta Grup)<br />
            Contacto: <a href="mailto:hola@cobratelo.es">hola@cobratelo.es</a>
          </p>

          <h2>2. Datos que recogemos</h2>
          <p>Recogemos únicamente los datos que el usuario proporciona voluntariamente:</p>
          <ul>
            <li><strong>Perfil de uso:</strong> situación laboral, edad, composición familiar, vivienda e ingresos aproximados, necesarios para calcular las ayudas aplicables. Estos datos no son datos personales identificativos.</li>
            <li><strong>Correo electrónico:</strong> cuando el usuario se suscribe al plan de alertas o facilita el email de su gestoría, con su consentimiento expreso.</li>
            <li><strong>Datos de pago:</strong> gestionados íntegramente por Stripe. Cobratelo.es no almacena datos de tarjeta.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <ul>
            <li>Calcular y mostrar las ayudas públicas aplicables al perfil del usuario.</li>
            <li>Enviar alertas semanales de nuevas convocatorias (solo usuarios suscritos).</li>
            <li>Gestionar la relación comercial derivada de la suscripción.</li>
          </ul>

          <h2>4. Base jurídica</h2>
          <p>
            El tratamiento se basa en el consentimiento del usuario (Art. 6.1.a RGPD) y en la
            ejecución del contrato de servicio (Art. 6.1.b RGPD).
          </p>

          <h2>5. Conservación de datos</h2>
          <p>
            Los datos de perfil (anónimos) se conservan durante el uso del servicio. Los datos de
            email se conservan mientras el usuario mantenga la suscripción activa o hasta que
            solicite su eliminación.
          </p>

          <h2>6. Derechos del usuario</h2>
          <p>
            El usuario puede ejercer sus derechos de acceso, rectificación, supresión, oposición,
            portabilidad y limitación del tratamiento escribiendo a{' '}
            <a href="mailto:hola@cobratelo.es">hola@cobratelo.es</a>.
          </p>

          <h2>7. Transferencias internacionales</h2>
          <p>
            Los datos pueden ser procesados por proveedores ubicados fuera de la UE (Supabase,
            Stripe, Anthropic, Vercel), todos bajo garantías adecuadas conforme al RGPD.
          </p>

          <h2>8. Reclamaciones</h2>
          <p>
            Si considera que sus derechos han sido vulnerados, puede presentar una reclamación ante
            la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
          </p>

          <p className="text-xs text-[#888882] mt-8">Última actualización: mayo 2026</p>
        </div>
      </div>
    </>
  )
}
