import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { C, bgMesh, navStyle, inputStyle, btnPrimary } from '../lib/theme'

export default function Login() {
  const router = useRouter()
  const [modo, setModo] = useState('login') // login | registro | magic
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/')
    setLoading(false)
  }

  const handleRegistro = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMsg('Revisa tu email para confirmar tu cuenta.')
    setLoading(false)
  }

  const handleMagic = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setMsg('Te hemos enviado un enlace mágico. Revisa tu email.')
    setLoading(false)
  }

  return (
    <>
      <Head><title>Acceder — Cóbratelo.es</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div style={bgMesh}>

        <nav style={navStyle}>
          <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <Link href="/" className="font-display font-bold text-xl" style={{ color: C.text, textDecoration: 'none', letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: C.green }}>.es</span>
            </Link>
            <Link href="/perfil" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Empezar gratis →</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: 36, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)`, opacity: 0.5 }} />

            <h1 className="font-display font-bold" style={{ fontSize: 26, letterSpacing: '-1px', color: C.text, marginBottom: 6 }}>
              {modo === 'login' ? 'Bienvenido de nuevo' : modo === 'registro' ? 'Crear cuenta' : 'Acceso sin contraseña'}
            </h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
              {modo === 'login' ? 'Accede a tus ayudas guardadas' : modo === 'registro' ? 'Empieza a descubrir tus ayudas' : 'Te enviamos un enlace a tu email'}
            </p>

            {msg ? (
              <div style={{ background: C.greenDim, border: `1px solid rgba(0,232,122,0.25)`, borderRadius: 12, padding: 16, color: C.green, fontSize: 14 }}>{msg}</div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" style={{ ...inputStyle }}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e => e.target.style.borderColor = C.border} />
                </div>

                {modo !== 'magic' && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" style={{ ...inputStyle }}
                      onFocus={e => e.target.style.borderColor = C.green}
                      onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                )}

                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

                <button onClick={modo === 'login' ? handleLogin : modo === 'registro' ? handleRegistro : handleMagic}
                  disabled={loading || !email}
                  style={{ ...btnPrimary, width: '100%', textAlign: 'center', opacity: loading || !email ? 0.5 : 1, marginBottom: 16 }}>
                  {loading ? 'Procesando...' : modo === 'login' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  {modo !== 'magic' && (
                    <button onClick={() => setModo('magic')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                      Acceder sin contraseña →
                    </button>
                  )}
                  {modo === 'login' && (
                    <button onClick={() => setModo('registro')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                      ¿Sin cuenta? Regístrate gratis
                    </button>
                  )}
                  {(modo === 'registro' || modo === 'magic') && (
                    <button onClick={() => setModo('login')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                      ← Volver al login
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
