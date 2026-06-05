import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/admin-session'

const ADMIN_ROUTES = /^\/admin(\/.*)?$/
const PUBLIC_ADMIN_ROUTES = ['/admin/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!ADMIN_ROUTES.test(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_ADMIN_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_session')?.value
  const session = token ? await verifyAdminSession(token) : null

  if (!session?.isAdmin) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
