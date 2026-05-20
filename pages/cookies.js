import Head from 'next/head'
import Link from 'next/link'

export default function Cookies() {
  return (
    <>
      <Head>
        <title>Política de Cookies — Cobratelo</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cobratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 pb-20 prose prose-sm">
          <h1 className="font-display text-4xl font-bold text-[#111110] mb-8">Política de Cookies</h1>

          <h2>¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que los sitios web almacenan en el navegador
            del usuario para recordar preferencias o gestionar sesiones.
          </p>

          <h2>Cookies que utilizamos</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#E0DAD0]">
                <th className="p-2 text-left">Cookie</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Finalidad</th>
                <th className="p-2 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E0DAD0]">
                <td className="p-2">__stripe_*</td>
                <td className="p-2">Terceros</td>
                <td className="p-2">Gestión de pagos seguros (Stripe)</td>
                <td className="p-2">Sesión</td>
              </tr>
              <tr className="border-b border-[#E0DAD0]">
                <td className="p-2">sb-* (Supabase)</td>
                <td className="p-2">Técnica</td>
                <td className="p-2">Gestión de sesión de usuario</td>
                <td className="p-2">7 días</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-4">
            Cobratelo.es <strong>no utiliza cookies de seguimiento, publicidad ni análisis</strong>.
            No compartimos datos de navegación con terceros para fines publicitarios.
          </p>

          <h2>Cómo desactivar las cookies</h2>
          <p>
            Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que
            desactivar las cookies técnicas puede afectar al funcionamiento del servicio de pago.
          </p>

          <p className="text-xs text-[#888882] mt-8">Última actualización: mayo 2026</p>
        </div>
      </div>
    </>
  )
}
