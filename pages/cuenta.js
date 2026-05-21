import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Cuenta() {
  const router = useRouter()
  const { perfil: perfilParam } = router.query
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilGuardado, setPerfilGuardado] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setSession(session)

      // Si viene con perfil del cuestionario, guardarlo en Supabase
      if (perfilParam) {
        try {
          const perfil = JSON.parse(decodeURIComponent(perfilParam))
          await supabase.from('usuarios').upsert({
            id: session.user.id,
            email: session.user.email,
            perfil,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          setPerfilGuardado(true)
        } catch (e) {
          console.error('Error guardando perfil:', e)
        }
      }

      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login')
      else setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [router.isReady])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Mi cuenta — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <button onClick={handleLogout}
            className="text-sm text-[#888882] hover:text-[#111110] transition-colors">
            Cerrar sesión
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-6 pb-20">
          {perfilGuardado && (
            <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-[#1A7A4A]">✓</span>
              <p className="text-sm font-medium text-[#1A7A4A]">Tu perfil ha sido guardado. Te avisaremos cuando abran nuevas convocatorias.</p>
            </div>
          )}

          <h1 className="font-display text-4xl font-bold text-[#111110] mb-2">Mi cuenta</h1>
          <p className="text-[#888882] mb-8">{session?.user?.email}</p>

          {/* Plan actual */}
          <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-[#111110]">Plan actual</h2>
              <span className="text-xs bg-[#F7F3EC] text-[#888882] px-3 py-1 rounded-full font-medium">Gratuito</span>
            </div>
            <p className="text-sm text-[#888882] mb-4">Consulta puntual sin alertas automáticas.</p>
            <Link href="/precios"
              className="inline-block bg-[#E8540A] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#d14a08] transition-colors">
              Activar alertas por 0,99€/mes
            </Link>
          </div>

          {/* Mis ayudas */}
          <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6 mb-4">
            <h2 className="font-semibold text-[#111110] mb-1">Mis ayudas</h2>
            <p className="text-sm text-[#888882] mb-4">Vuelve a ver las ayudas que te corresponden según tu perfil.</p>
            <Link href="/perfil"
              className="inline-block bg-[#111110] text-[#F7F3EC] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333330] transition-colors">
              Actualizar mi perfil →
            </Link>
          </div>

          {/* Datos de cuenta */}
          <div className="bg-white rounded-2xl border border-[#E0DAD0] p-6">
            <h2 className="font-semibold text-[#111110] mb-4">Datos de cuenta</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888882]">Email</span>
                <span className="text-[#111110] font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888882]">Miembro desde</span>
                <span className="text-[#111110] font-medium">
                  {new Date(session?.user?.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F0EAE0]">
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
