import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  function redirectTo(path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 소비자 로그인 완료 후 재방문 → 홈으로
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 파트너 로그인 완료 후 재방문 → 대시보드로
  if (pathname.startsWith('/partner/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/partner'
    return NextResponse.redirect(url)
  }

  // /partner/* 보호 (login 제외) → 파트너 로그인
  if (pathname.startsWith('/partner') && !pathname.startsWith('/partner/login')) {
    if (!user) return redirectTo('/partner/login')
  }

  // /reserve/* 보호 → 소비자 로그인
  if (pathname.startsWith('/reserve') && !pathname.startsWith('/reserve/demo')) {
    if (!user) return redirectTo('/login')
  }

  // /review/* 보호 → 소비자 로그인
  if (pathname.startsWith('/review')) {
    if (!user) return redirectTo('/login')
  }

  // /qr/* 보호 → 파트너 로그인
  if (pathname.startsWith('/qr')) {
    if (!user) return redirectTo('/partner/login')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/login',
    '/partner/:path*',
    '/reserve/:path*',
    '/review/:path*',
    '/qr/:path*',
  ],
}
