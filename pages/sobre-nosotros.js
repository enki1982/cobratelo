import Head from 'next/head'
import Link from 'next/link'
import { C } from '../lib/theme'

export default function SobreNosotros() {
  return (
    <>
      <Head>
        <title>Sobre nosotros — Cóbratelo.es</title>
        <meta name="description" content="Cóbratelo.es es una plataforma tecnológica que detecta automáticamente las ayudas públicas disponibles para cada ciudadano y gestoría en España." />
        <meta name="robots" content="index, follow" />
      </Head>
      <div style={{ background: '#321A00', minHeight: '100vh', color: '#FFF5EB' }}>
        <nav style={{ background: 'rgba(50,26,0,0.95)', borderBottom: '1px solid rgba(255,200,120,0.12)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none' }}>cóbratelo<span style={{ color: '#FF8300' }}>.es</span></Link>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/precios" style={{ fontSize: 13, color: 'rgba(255,245,235,0.5)', textDecoration: 'none' }}>Precios</Link>
              <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 100, textDecoration: 'none' }}>Mis ayudas</Link>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>

          <p style={{ fontSize: 11, fontWeight: 700, color: '#FF8300', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>SOBRE NOSOTROS</p>

          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 24, color: '#FFF5EB' }}>
            La forma moderna de conectar ciudadanos, ayudas públicas y gestorías
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,245,235,0.65)', lineHeight: 1.8, marginBottom: 48, borderBottom: '1px solid rgba(255,200,120,0.1)', paddingBottom: 48 }}>
            Cóbratelo nació de una constatación simple: la mayoría de las ayudas públicas no se solicitan porque nadie sabe que existen. Miles de millones de euros en subvenciones, prestaciones y bonificaciones quedan sin reclamar cada año, no por falta de derecho, sino por falta de información.
          </p>

          {/* Secciones */}
          {[
            {
              t: 'El problema que resolvemos',
              p: 'El sistema de ayudas públicas en España es inmenso y fragmentado: más de 200 convocatorias activas en cualquier momento, repartidas entre el Estado, 17 comunidades autónomas, cientos de municipios y organismos como el SEPE, AEAT, Red.es o el IMSERSO. Ningún ciudadano puede seguirle la pista sin dedicarle decenas de horas.',
            },
            {
              t: 'Cómo funciona',
              p: 'Nuestro sistema analiza el perfil de cada usuario — situación laboral, familiar, de vivienda, edad, localización — y lo cruza contra nuestra base de datos de ayudas, actualizada continuamente de fuentes oficiales. En menos de 2 minutos, el usuario ve exactamente qué ayudas le corresponden, con el importe estimado y el enlace directo a cada convocatoria.',
            },
            {
              t: 'Para gestorías y asesores',
              p: 'Las gestorías son aliadas naturales del sistema: tienen la confianza del cliente y la capacidad de tramitar. Cóbratelo ofrece a los despachos una herramienta para detectar ayudas para todos sus clientes de forma automática, recibir nuevos clientes cualificados y añadir un servicio de valor diferencial sin trabajo extra. No competimos con las gestorías. Les damos más clientes.',
            },
            {
              t: 'Tecnología y datos',
              p: 'Cóbratelo.es es una plataforma tecnológica construida sobre fuentes de datos oficiales: BDNS (Base de Datos Nacional de Subvenciones), portales autonómicos, BOE y DOGC entre otros. Utilizamos inteligencia artificial para mantener la base de datos actualizada y para mejorar continuamente la relevancia de los resultados para cada perfil.',
            },
          ].map(({ t, p }) => (
            <div key={t} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFF5EB', marginBottom: 12 }}>{t}</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,245,235,0.6)', lineHeight: 1.8 }}>{p}</p>
            </div>
          ))}

          {/* Valores */}
          <div style={{ background: 'rgba(255,200,120,0.06)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 20, padding: '32px', marginBottom: 48, marginTop: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFF5EB', marginBottom: 20 }}>Principios</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {[
                ['Transparencia', 'Mostramos fuentes oficiales. Nunca inventamos importes ni requisitos.'],
                ['Privacidad', 'Los datos del perfil solo se usan para calcular ayudas. Nunca los cedemos a terceros.'],
                ['Gratuito para ciudadanos', 'El acceso básico es y seguirá siendo gratuito para personas físicas.'],
                ['Independencia', 'No tenemos acuerdos con gestorías ni cobramos por redirigir clientes.'],
              ].map(([t, d]) => (
                <div key={t}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#FF8300', marginBottom: 6 }}>{t}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,245,235,0.5)', lineHeight: 1.6 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/perfil" style={{ background: '#FF8300', color: '#1a0d00', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 100, textDecoration: 'none', display: 'inline-block' }}>
              Descubrir mis ayudas →
            </Link>
            <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.3)', marginTop: 16 }}>
              Preguntas: <a href="mailto:hola@cobratelo.es" style={{ color: '#FF8300', textDecoration: 'none' }}>hola@cobratelo.es</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
