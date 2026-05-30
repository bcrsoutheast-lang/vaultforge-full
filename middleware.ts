import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/pain-room', '/pain-intake', '/profile/edit', '/deal-room/new', '/members']
  const isProtected = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect logged in users away from login
  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/pain-room', req.url))
  }

  return res
}

export const config = {
  matcher: ['/pain-room/:path*', '/pain-intake', '/profile/edit', '/deal-room/new', '/members', '/login']
}
