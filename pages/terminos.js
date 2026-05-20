import Head from 'next/head'
import Link from 'next/link'

export default function Terminos() {
  return (
    <>
      <Head>
        <title>Términos y Condiciones — Cobratelo</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pb-20 prose prose-sm">
          <h1 className="font-display text-4xl font-bold text-[#111110] mb-8">Términos y Condiciones</h1>

          <h2>1. El servicio</h2>
          <p>
            Cobratelo.es ofrece un servicio de orientación sobre ayudas y subvenciones públicas en
            España. El servicio se presta en modalidad freemium:
          </p>
          <ul>
            <li><strong>Plan Gratuito:</strong> consulta puntual sin registro.</li>
            <li><strong>Plan Alertas (0,99€/mes):</strong> alertas semanales personalizadas cuando abren nuevas convocatorias.</li>
            <li><strong>Planes Gestoría (desde 49€/mes):</strong> acceso multi-cliente para profesionales.</li>
          </ul>

          <h2>2. Limitación de responsabilidad</h2>
          <p>
            La información proporcionada es orientativa. Cobratelo.es no garantiza que el usuario
            cumpla los requisitos para ninguna ayuda, ni que las convocatorias estén vigentes en el
            momento de la consulta. El usuario debe verificar siempre en las fuentes oficiales.
          </p>

          <h2>3. Suscripciones y pagos</h2>
          <p>
            Las suscripciones se renuevan automáticamente cada mes. El usuario puede cancelar en
            cualquier momento desde su cuenta o escribiendo a{' '}
            <a href="mailto:hola@cobratelo.es">hola@cobratelo.es</a>. No se realizan devoluciones
            de períodos ya facturados salvo error imputable al servicio.
          </p>

          <h2>4. Modificaciones del servicio</h2>
          <p>
            Cobratelo.es se reserva el derecho de modificar el servicio, los precios o estas
            condiciones con un preaviso mínimo de 30 días a los usuarios con suscripción activa.
          </p>

          <h2>5. Ley aplicable</h2>
          <p>
            Estos términos se rigen por la legislación española. Cualquier controversia se somete
            a los juzgados de Barcelona.
          </p>

          <p className="text-xs text-[#888882] mt-8">Última actualización: mayo 2026</p>
        </div>
      </div>
    </>
  )
}
