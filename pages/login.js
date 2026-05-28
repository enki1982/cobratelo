import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { C, bgMesh, navStyle, inputStyle } from '../lib/theme'

export default function Login() {
  const router = useRouter()
  const [modo, setModo] = useState('magic') // magic | password | registro
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const returnUrl = router.query.return
  const sessionExpired = router.query.session_expired === '1'

  const redirect = () => {
    router.push(returnUrl ? decodeURIComponent(returnUrl) : '/')
  }

  const handleMagic = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else {
      setMsg('Te hemos enviado un enlace a tu email. Haz clic en él para entrar — sin contraseña.')
      window.cobratelo_track?.('magic_link_sent', { method: 'email' })
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos.')
    else redirect()
    setLoading(false)
  }

  const handleRegistro = async () => {
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      window.cobratelo_track?.('sign_up', { method: 'email' })
      // Enviar email de bienvenida en background (no bloquea)
      fetch('/api/bienvenida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
      // Tras registro, ir al cuestionario directamente
      router.push(returnUrl ? decodeURIComponent(returnUrl) : '/perfil?onboarding=true')
    }
    setLoading(false)
  }


  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + (returnUrl || '/resultados') : '/resultados' }
    })
    if (error) console.error(error)
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

        <div style={{ maxWidth: 400, margin: '64px auto', padding: '0 24px' }}>

          {/* Google OAuth */}
          <button onClick={handleGoogle}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', color: '#1a1a1a', fontWeight: 600, fontSize: 14, padding: '13px 0', borderRadius: 100, border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,200,120,0.12)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,245,235,0.3)' }}>o con email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,200,120,0.12)' }} />
          </div>

          {/* Tabs de modo */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: 4, marginBottom: 24, gap: 4 }}>
            {[
              { id: 'magic', label: 'Entrar sin contraseña' },
              { id: 'password', label: 'Con contraseña' },
            ].map(t => (
              <button key={t.id} onClick={() => { setModo(t.id); setMsg(null); setError(null) }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  background: modo === t.id ? C.green : 'transparent',
                  color: modo === t.id ? '#000' : C.muted }}>
                {t.label}
              </button>
            ))}
          </div>

          {sessionExpired && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>Sesión cerrada automáticamente</div>
                <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)' }}>Tu cuenta se abrió en otro dispositivo. Vuelve a entrar para continuar.</div>
              </div>
            </div>
          )}

          <div style={{ background: '#2a1500', border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.green},transparent)`, opacity: 0.4 }} />

            {/* MAGIC LINK */}
            {modo === 'magic' && !msg && (
              <>
                <h1 className="font-display font-bold" style={{ fontSize: 22, color: C.text, marginBottom: 6, letterSpacing: '-0.5px' }}>
                  Accede sin contraseña
                </h1>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                  Escribe tu email y te enviamos un enlace mágico. Un clic y ya estás dentro — sin recordar ninguna contraseña.
                </p>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tu email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ ...inputStyle, marginBottom: 16 }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  onKeyDown={e => e.key === 'Enter' && email && handleMagic()} />
                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button onClick={handleMagic} disabled={loading || !email}
                  style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 100, border: 'none', cursor: loading || !email ? 'not-allowed' : 'pointer', width: '100%', opacity: loading || !email ? 0.5 : 1 }}>
                  {loading ? 'Enviando enlace...' : 'Enviarme el enlace →'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button onClick={() => { setModo('registro'); setMsg(null); setError(null) }}
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                    ¿Primera vez? Crea tu cuenta gratis
                  </button>
                </div>
              </>
            )}

            {/* CONTRASEÑA */}
            {modo === 'password' && !msg && (
              <>
                <h1 className="font-display font-bold" style={{ fontSize: 22, color: C.text, marginBottom: 6, letterSpacing: '-0.5px' }}>
                  {modo === 'registro' ? 'Crea tu cuenta' : 'Accede con contraseña'}
                </h1>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                  {modo === 'registro'
                    ? 'Elige un email y contraseña para tu cuenta en Cóbratelo.es.'
                    : 'Introduce tu email y contraseña para acceder.'}
                </p>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ ...inputStyle, marginBottom: 12 }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, marginBottom: 20 }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  onKeyDown={e => e.key === 'Enter' && email && password && handleLogin()} />
                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button onClick={handleLogin} disabled={loading || !email || !password}
                  style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 100, border: 'none', cursor: 'pointer', width: '100%', opacity: loading || !email || !password ? 0.5 : 1, marginBottom: 12 }}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => { setModo('registro'); setError(null) }}
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                    ¿Primera vez? Crea tu cuenta gratis
                  </button>
                </div>
              </>
            )}

            {/* REGISTRO */}
            {modo === 'registro' && !msg && (
              <>
                <h1 className="font-display font-bold" style={{ fontSize: 22, color: C.text, marginBottom: 6, letterSpacing: '-0.5px' }}>
                  Crea tu cuenta gratis
                </h1>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                  Accede a todas tus ayudas personalizadas y guarda tus resultados. Completamente gratis.
                </p>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ ...inputStyle, marginBottom: 12 }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{ ...inputStyle, marginBottom: 8 }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>O usa el enlace mágico y olvídate de contraseñas</p>
                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button onClick={handleRegistro} disabled={loading || !email || !password}
                  style={{ background: C.green, color: '#000', fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 100, border: 'none', cursor: 'pointer', width: '100%', opacity: loading || !email || !password ? 0.5 : 1, marginBottom: 12 }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
                </button>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => { setModo('magic'); setError(null) }}
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                    Prefiero entrar sin contraseña →
                  </button>
                  <button onClick={() => { setModo('password'); setError(null) }}
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                    Ya tengo cuenta — Entrar
                  </button>
                </div>
              </>
            )}

            {/* MENSAJE ENVIADO */}
            {msg && (
              <div style={{ textAlign: 'center' }}>
                
                <h2 className="font-display font-bold" style={{ fontSize: 20, color: C.text, marginBottom: 12 }}>Revisa tu email</h2>
                <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{msg}</p>
                <button onClick={() => { setMsg(null); setError(null) }}
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, padding: '10px 20px', borderRadius: 100, cursor: 'pointer' }}>
                  ← Volver
                </button>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 16 }}>
            Al acceder aceptas los <Link href="/terminos" style={{ color: C.green, textDecoration: 'none' }}>Términos de uso</Link> y la <Link href="/privacidad" style={{ color: C.green, textDecoration: 'none' }}>Política de privacidad</Link>
          </p>
        </div>
      </div>
    </>
  )
}
