import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const { redirect, perfil } = router.query
  const [modo, setModo] = useState('login') // 'login' | 'registro' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicEnviado, setMagicEnviado] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirect || '/cuenta')
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login')) setError('Email o contraseña incorrectos.')
      else setError(error.message)
    } else {
      router.push(redirect || '/cuenta')
    }
    setLoading(false)
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { nombre },
        emailRedirectTo: `${window.location.origin}/cuenta${perfil ? `?perfil=${perfil}` : ''}`,
      }
    })
    if (error) setError(error.message)
    else {
      setModo('confirmacion')
    }
    setLoading(false)
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/cuenta${perfil ? `?perfil=${perfil}` : ''}` }
    })
    if (error) setError('Error al enviar el enlace.')
    else setMagicEnviado(true)
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>{modo === 'registro' ? 'Crear cuenta' : 'Acceder'} — Cóbratelo</title>
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

            {/* Confirmación registro */}
            {modo === 'confirmacion' && (
              <div className="text-center">
                <div className="text-6xl mb-6">📬</div>
                <h2 className="font-display text-3xl font-bold text-[#111110] mb-3">Revisa tu email</h2>
                <p className="text-[#888882] mb-2">Hemos enviado un enlace de confirmación a</p>
                <p className="font-semibold text-[#111110] mb-6">{email}</p>
                <p className="text-sm text-[#888882]">Haz clic en el enlace para activar tu cuenta.</p>
              </div>
            )}

            {/* Magic link enviado */}
            {magicEnviado && (
              <div className="text-center">
                <div className="text-6xl mb-6">✉️</div>
                <h2 className="font-display text-3xl font-bold text-[#111110] mb-3">Enlace enviado</h2>
                <p className="text-[#888882] mb-2">Hemos enviado un enlace de acceso a</p>
                <p className="font-semibold text-[#111110] mb-6">{email}</p>
                <button onClick={() => { setMagicEnviado(false); setModo('login') }}
                  className="text-sm text-[#1A7A4A] underline">Volver al inicio de sesión</button>
              </div>
            )}

            {/* Login normal */}
            {!magicEnviado && modo === 'login' && (
              <>
                <h1 className="font-display text-4xl font-bold text-[#111110] mb-2">Accede a tu cuenta</h1>
                <p className="text-[#888882] mb-8">¿No tienes cuenta?{' '}
                  <button onClick={() => setModo('registro')} className="text-[#1A7A4A] font-semibold underline">Regístrate gratis</button>
                </p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com" required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Contraseña</label>
                    <div className="relative">
                      <input type={mostrarPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors pr-12" />
                      <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888882] text-sm">
                        {mostrarPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#111110] text-[#F7F3EC] font-semibold hover:bg-[#333330] transition-colors disabled:opacity-50">
                    {loading ? 'Accediendo...' : 'Entrar →'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => setModo('magic')} className="text-sm text-[#888882] underline">
                    Prefiero recibir un enlace por email
                  </button>
                </div>
              </>
            )}

            {/* Registro */}
            {!magicEnviado && modo === 'registro' && (
              <>
                <h1 className="font-display text-4xl font-bold text-[#111110] mb-2">Crear cuenta</h1>
                <p className="text-[#888882] mb-8">¿Ya tienes cuenta?{' '}
                  <button onClick={() => setModo('login')} className="text-[#1A7A4A] font-semibold underline">Inicia sesión</button>
                </p>
                <form onSubmit={handleRegistro} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Nombre (opcional)</label>
                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com" required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Contraseña</label>
                    <div className="relative">
                      <input type={mostrarPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors pr-12" />
                      <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888882] text-sm">
                        {mostrarPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#111110] text-[#F7F3EC] font-semibold hover:bg-[#333330] transition-colors disabled:opacity-50">
                    {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
                  </button>
                </form>
                <p className="text-xs text-[#B0AAA0] text-center mt-6">
                  Al registrarte aceptas los{' '}
                  <Link href="/terminos" className="underline">Términos</Link>{' '}y la{' '}
                  <Link href="/privacidad" className="underline">Privacidad</Link>.
                </p>
              </>
            )}

            {/* Magic link */}
            {!magicEnviado && modo === 'magic' && (
              <>
                <h1 className="font-display text-4xl font-bold text-[#111110] mb-2">Acceso sin contraseña</h1>
                <p className="text-[#888882] mb-8">Te enviamos un enlace directo a tu email.</p>
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111110] mb-2">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com" required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E0DAD0] bg-white focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#111110] text-[#F7F3EC] font-semibold hover:bg-[#333330] transition-colors disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Enviarme el enlace →'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => setModo('login')} className="text-sm text-[#888882] underline">
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
