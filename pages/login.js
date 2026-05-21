import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const { redirect, perfil } = router.query
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si ya está logueado, redirigir
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirect || '/cuenta')
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/cuenta${perfil ? `?perfil=${perfil}` : ''}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })

    if (error) {
      setError('Error al enviar el enlace. Inténtalo de nuevo.')
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Acceder — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
        <nav className="px-6 py-5 max-w-md mx-auto w-full">
          <Link href="/" className="font-display text-xl font-bold text-[#111110]">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 pb-20">
          <div className="w-full max-w-md">
            {!enviado ? (
              <>
                <h1 className="font-display text-4xl font-bold text-[#111110] mb-2">
                  Accede a tu cuenta
                </h1>
                <p className="text-[#888882] mb-8">
                  Te enviamos un enlace mágico a tu email. Sin contraseñas.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3.5 rounded-full bg-[#111110] text-[#F7F3EC] font-semibold hover:bg-[#333330] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando...' : 'Enviarme el enlace →'}
                  </button>
                </form>

                <p className="text-xs text-[#B0AAA0] text-center mt-6">
                  Al acceder aceptas los{' '}
                  <Link href="/terminos" className="underline">Términos y Condiciones</Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="underline">Política de Privacidad</Link>.
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-6">📬</div>
                <h2 className="font-display text-3xl font-bold text-[#111110] mb-3">
                  Revisa tu email
                </h2>
                <p className="text-[#888882] mb-2">
                  Hemos enviado un enlace a
                </p>
                <p className="font-semibold text-[#111110] mb-6">{email}</p>
                <p className="text-sm text-[#888882]">
                  Haz clic en el enlace del email para acceder. Puede tardar unos segundos.
                </p>
                <button
                  onClick={() => setEnviado(false)}
                  className="mt-6 text-sm text-[#1A7A4A] underline"
                >
                  Usar otro email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
