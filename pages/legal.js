import Head from 'next/head'
import Link from 'next/link'

export default function Legal() {
  return (
    <>
      <Head>
        <title>Aviso Legal — Cóbratelo</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pb-20 prose prose-sm">
          <h1 className="font-display text-4xl font-bold text-[#111110] mb-8">Aviso Legal</h1>

          <h2>1. Titular del sitio web</h2>
          <p>
            En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
            Información y de Comercio Electrónico (LSSI-CE), se informa que el presente sitio web
            <strong> cobratelo.es</strong> es titularidad de <strong>KIESBROTER SL</strong>,
            
          </p>
          <p>Correo electrónico de contacto: <a href="mailto:hola@cobratelo.es">hola@cobratelo.es</a></p>

          <h2>2. Objeto y condiciones de uso</h2>
          <p>
            Cobratelo.es es una plataforma de información y orientación sobre ayudas, subvenciones y
            prestaciones públicas en España. Los resultados ofrecidos son <strong>orientativos</strong> y
            no constituyen asesoramiento legal, financiero ni administrativo.
          </p>
          <p>
            El usuario se compromete a hacer un uso lícito del servicio, sin vulnerar derechos de
            terceros ni la legalidad vigente. Queda prohibido el uso automatizado o masivo del servicio
            sin autorización expresa.
          </p>

          <h2>3. Propiedad intelectual</h2>
          <p>
            Todos los contenidos del sitio web — incluyendo textos, diseño, código y marca — son
            propiedad de KIESBROTER SL o sus licenciantes, y están protegidos por la
            legislación de propiedad intelectual e industrial vigente.
          </p>

          <h2>4. Exclusión de responsabilidad</h2>
          <p>
            Cobratelo.es no garantiza la exactitud, exhaustividad o actualización de la información
            proporcionada. Las convocatorias de ayudas y subvenciones pueden cambiar sin previo aviso.
            El usuario debe verificar siempre la información en las fuentes oficiales antes de realizar
            cualquier gestión.
          </p>

          <h2>5. Legislación aplicable</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia derivada
            del uso del sitio web, las partes se someten a los juzgados y tribunales de Barcelona.
          </p>

          <p className="text-xs text-[#888882] mt-8">Última actualización: mayo 2026</p>
        </div>
      </div>
    </>
  )
}
