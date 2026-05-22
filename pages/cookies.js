import Head from 'next/head'
import Link from 'next/link'
import { C, bgMesh, navStyle } from '../lib/theme'

export default function Cookies() {
  return (
    <>
      <Head><title>Política de Cookies — Cóbratelo.es</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div style={bgMesh}>
        <nav style={navStyle}>
          <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, padding: '0' }}>
            <Link href="/" className="font-display font-bold text-xl" style={{ color: C.text, textDecoration: 'none', letterSpacing: '-0.5px' }}>
              cóbratelo<span style={{ color: C.green }}>.es</span>
            </Link>
          </div>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>
          <h1 className="font-display font-bold" style={{ fontSize: 36, letterSpacing: '-1.5px', color: C.text, marginBottom: 8 }}>Política de Cookies</h1>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 40 }}>Última actualización: mayo 2026</p>
          {[
            { t: '¿Qué son las cookies?', c: 'Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Permiten que el sitio recuerde información sobre tu visita.' },
            { t: '¿Qué cookies usamos?', c: 'Cóbratelo.es utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento de la web: cookies de sesión de autenticación (Supabase) y preferencias de consentimiento. No usamos cookies de publicidad ni de rastreo de terceros.' },
            { t: 'Cookies de sesión', c: 'Cuando inicias sesión, almacenamos un token de autenticación en tu navegador mediante localStorage. Este token es necesario para mantenerte identificado. Se elimina al cerrar sesión.' },
            { t: 'Cookies de preferencias', c: 'Guardamos tu decisión sobre el consentimiento de cookies (aceptar/rechazar) en localStorage con la clave "cobratelo_cookies". Esto evita que el banner aparezca en cada visita.' },
            { t: '¿Cómo gestionar las cookies?', c: 'Puedes eliminar las cookies desde la configuración de tu navegador en cualquier momento. También puedes revocar tu consentimiento borrando el dato "cobratelo_cookies" de localStorage.' },
            { t: 'Contacto', c: 'Para cualquier consulta sobre nuestra política de cookies: hola@cobratelo.es — KIESBROTER SL (NIF: B65417107), Mataró, Barcelona.' },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 32 }}>
              <h2 className="font-display font-bold" style={{ fontSize: 18, color: C.text, marginBottom: 8, letterSpacing: '-0.3px' }}>{s.t}</h2>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{s.c}</p>
            </div>
          ))}
          <Link href="/" style={{ color: C.green, fontSize: 14, textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    </>
  )
}
