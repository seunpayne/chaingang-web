import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/leaderboard',
    '/gallery',
    '/announcements',
    '/admin',
    '/news',
  ]

  const isProtected = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin route protection — check user_roles table
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    // Defer to server-side role check in the page component
    // Middleware only blocks unauthenticated — server component handles admin check
  }

  return supabaseResponse
}
