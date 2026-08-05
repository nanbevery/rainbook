import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getTrustedClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    const last = parts[parts.length - 1]
    if (last) return last
  }
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const trustedIp = getTrustedClientIp(request)

    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('x-forwarded-for')
    requestHeaders.delete('x-real-ip')
    requestHeaders.delete('x-client-ip')
    requestHeaders.set('x-client-ip', trustedIp)
    requestHeaders.set('x-real-ip', trustedIp)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
