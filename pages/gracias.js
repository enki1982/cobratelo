import Head from 'next/head'
import Link from 'next/link'

export default function Gracias() {
  return (
    <>
      <Head><title>¡Suscripción activada! — Cóbratelo</title></Head>
      <div className="min-h-screen bg-[#FFE2C4] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="font-display text-4xl font-bold text-[#1a0d00] mb-4">
            ¡Ya estás dentro!
          </h1>
          <p className="text-[#7a4a1a] mb-8">
            Tu suscripción está activa. A partir de ahora te avisaremos cada semana cuando abran convocatorias que te aplican.
          </p>
          <Link href="/perfil"
            className="bg-[#1a0d00] text-[#FFE2C4] font-semibold px-8 py-4 rounded-full inline-block hover:bg-[#333330] transition-colors">
            Ver mis ayudas →
          </Link>
        </div>
      </div>
    </>
  )
}
