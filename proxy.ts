import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn  = !!req.auth
  const pathname    = nextUrl.pathname

  const isCustomize = pathname.startsWith('/customize')
  const isCheckout  = pathname.startsWith('/checkout')
  const isOrders    = pathname.startsWith('/orders')
  const isProfile   = pathname.startsWith('/profile')
  const isAdmin     = pathname.startsWith('/admin')

  // Require login for customer-facing protected routes
  if ((isCustomize || isCheckout || isOrders || isProfile) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Require login for admin routes
  if (isAdmin && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Require ADMIN role for admin routes
  if (isAdmin && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/customize/:path*', '/checkout/:path*', '/orders/:path*', '/profile', '/profile/:path*', '/admin/:path*'],
}
