import Head from 'next/head'
import Link from 'next/link'

export default function Gracias() {
  return (
    <>
      <Head><title>¡Suscripción activada! — Cobratelo</title></Head>
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="font-display text-4xl font-bold text-[#111110] mb-4">
            ¡Ya estás dentro!
          </h1>
          <p className="text-[#888882] mb-8">
            Tu suscripción está activa. A partir de ahora te avisaremos cada semana cuando abran convocatorias que te aplican.
          </p>
          <Link href="/perfil"
            className="bg-[#111110] text-[#F7F3EC] font-semibold px-8 py-4 rounded-full inline-block hover:bg-[#333330] transition-colors">
            Ver mis ayudas →
          </Link>
        </div>
      </div>
    </>
  )
}
