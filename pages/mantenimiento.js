import Head from 'next/head'

export default function Mantenimiento() {
  return (
    <>
      <Head>
        <title>Cóbratelo — Mantenimiento</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Cóbratelo está temporalmente fuera de servicio." />
      </Head>
      <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#321A00',color:'#FFF5EB',padding:'24px',fontFamily:'system-ui,-apple-system,sans-serif',textAlign:'center'}}>
        <section style={{maxWidth:580}}>
          <div style={{fontSize:18,fontWeight:800,letterSpacing:'.04em',color:'#FF8300',marginBottom:36}}>Cóbratelo</div>
          <h1 style={{fontSize:'clamp(28px,5vw,44px)',lineHeight:1.15,margin:'0 0 22px'}}>Estamos realizando tareas de mantenimiento</h1>
          <p style={{fontSize:17,lineHeight:1.7,color:'#E5D5C5',margin:0}}>El servicio no está disponible temporalmente. Gracias por tu comprensión.</p>
        </section>
      </main>
    </>
  )
}
