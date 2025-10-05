import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block editor and API routes in production
  if (process.env.NODE_ENV === 'production') {
    if (pathname.startsWith('/editor') || pathname.startsWith('/api')) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/editor/:path*', '/api/:path*'],
}
