import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes
  const publicRoutes = ['/', '/login', '/pain-intake', '/founders']
  const isPublic = publicRoutes.includes(req.nextUrl.pathname)

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
