import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (user && (pathname === '/login' || pathname === '/register')) {
    const cabinetUrl = request.nextUrl.clone()
    cabinetUrl.pathname = '/cabinet'
    cabinetUrl.search = ''
    return copyCookies(response, NextResponse.redirect(cabinetUrl))
  }

  if (!user && pathname.startsWith('/cabinet')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return copyCookies(response, NextResponse.redirect(loginUrl))
  }

  return response
}

export const config = {
  // Public landing/game HTML must not wait for a remote auth request.
  matcher: ['/login', '/register', '/cabinet/:path*'],
}
