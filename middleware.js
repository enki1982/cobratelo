import { NextResponse } from 'next/server'

// Cierre temporal de Cóbratelo. No se permite acceder a la aplicación
// ni ejecutar sus API; se conserva el webhook para eventos de Stripe.
export function middleware(request) {
  const { pathname } = request.nextUrl
  if (pathname === '/api/webhook-stripe') {
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Servicio temporalmente suspendido' }, { status: 503 })
  }
  if (pathname === '/mantenimiento') {
    return NextResponse.next()
  }
  const url = request.nextUrl.clone()
  url.pathname = '/mantenimiento'
  url.search = ''
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)'],
}
