import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = verifyToken(token)
  if (!payload) {
    // Log why token verification failed (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Token verification failed for path:', pathname)
    }
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Delete cookie by setting it to empty with expired date
    response.cookies.set('auth-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    return response
  }
  
  // Log successful token verification (for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Token verified for user:', payload.email, 'on path:', pathname)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
