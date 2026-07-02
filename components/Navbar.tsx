'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const STORE_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/products',  label: 'Shop' },
  { href: '/customize', label: 'Customize' },
]

const ADMIN_LINKS = [
  { href: '/admin',          label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/pricing',  label: 'Pricing' },
  { href: '/admin/orders',   label: 'Orders' },
  { href: '/admin/payments', label: 'Payments' },
]

function Avatar({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm select-none ring-2 ring-amber-500/30">
      {initial}
    </div>
  )
}

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-stone-800 border border-stone-600/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
      {/* User info */}
      <div className="px-4 py-3 border-b border-stone-700 bg-stone-900/60">
        <div className="text-white font-semibold text-sm truncate">{session?.user?.name}</div>
        <div className="text-stone-400 text-xs truncate mt-0.5">{session?.user?.email}</div>
        {isAdmin && (
          <span className="inline-block mt-1.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        )}
      </div>

      {/* Links */}
      <div className="py-1">
        {!isAdmin && (
          <>
            <Link href="/orders" onClick={onClose}
              className="flex items-center gap-2.5 px-4 py-2.5 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors text-sm"
            >
              <span>📦</span> My Orders
            </Link>
            <Link href="/profile" onClick={onClose}
              className="flex items-center gap-2.5 px-4 py-2.5 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors text-sm"
            >
              <span>👤</span> My Profile
            </Link>
          </>
        )}
        {isAdmin && ADMIN_LINKS.map(l => (
          <Link key={l.href} href={l.href} onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors text-sm"
          >
            <span>⚙️</span> {l.label}
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="border-t border-stone-700 py-1">
        <button
          onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-stone-300 hover:text-red-400 hover:bg-stone-700 transition-colors text-sm text-left"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Navbar() {
  const pathname           = usePathname()
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [dropOpen, setDropOpen]   = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const isAdmin = session?.user?.role === 'ADMIN'
  const isAuthPage = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  const navLinks = isAdmin ? ADMIN_LINKS : STORE_LINKS

  return (
    <nav className="sticky top-0 z-50 bg-stone-900 border-b-2 border-amber-500/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Warm amber glow behind logo area */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 8% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href={isAdmin ? '/admin' : '/'} className="flex items-center gap-3 shrink-0 group">
          {/* Logo image */}
          <div className="h-11 w-11 rounded-xl overflow-hidden ring-1 ring-stone-700/60 group-hover:ring-amber-500/50 transition-all shadow-md shadow-black/30 shrink-0">
            <Image
              src="/logo.png"
              alt="Mrs Achcharu"
              width={200}
              height={200}
              className="h-11 w-11 object-cover"
              priority
            />
          </div>
          {/* Creative brand text */}
          <div className="leading-none select-none">
            <div className="flex items-center gap-1 mb-[2px]">
              <span className="block h-px w-3 bg-green-500/70" />
              <span className="text-[8px] text-green-400 font-extrabold tracking-[0.28em] uppercase">Mrs</span>
              <span className="block h-px w-3 bg-green-500/70" />
            </div>
            <div className="font-display text-[18px] text-amber-400 font-bold leading-none tracking-wide">Achcharu</div>
            <div className="text-[7px] text-stone-400 tracking-[0.22em] uppercase font-medium mt-[2px]">Homemade with love</div>
          </div>
        </Link>

        {/* ── Desktop nav links ── */}
        {!isAuthPage && (
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? 'text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20'
                    : 'text-stone-200 hover:text-white hover:bg-stone-700/80'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right section ── */}
        <div className="flex items-center gap-2 shrink-0">

          {status === 'loading' && (
            <div className="w-8 h-8 rounded-full bg-stone-700 animate-pulse" />
          )}

          {status === 'unauthenticated' && (
            <Link href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-md shadow-amber-500/20"
            >
              Sign In
            </Link>
          )}

          {status === 'authenticated' && session?.user && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(p => !p)}
                className="flex items-center gap-2.5 hover:bg-stone-700/80 px-2 py-1.5 rounded-xl transition-colors"
              >
                <Avatar name={session.user.name ?? 'U'} />
                <span className="hidden sm:block text-stone-100 text-sm font-medium max-w-28 truncate">
                  {session.user.name}
                </span>
                <span className="text-stone-500 text-xs">{dropOpen ? '▲' : '▼'}</span>
              </button>

              {dropOpen && <ProfileDropdown onClose={() => setDropOpen(false)} />}
            </div>
          )}

          {/* ── Mobile hamburger ── */}
          {!isAuthPage && (
            <button
              className="md:hidden p-2 text-stone-300 hover:text-amber-400 hover:bg-stone-700/80 rounded-lg transition-colors"
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Toggle menu"
            >
              {menuOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && !isAuthPage && (
        <div className="md:hidden border-t border-stone-700 bg-stone-900">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? 'text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20'
                    : 'text-stone-200 hover:text-white hover:bg-stone-700/80'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {status === 'unauthenticated' && (
              <Link href="/login"
                className="mt-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 transition-colors text-center"
              >
                Sign In
              </Link>
            )}

            {status === 'authenticated' && session?.user && (
              <div className="mt-2 pt-3 border-t border-stone-700 flex flex-col gap-1">
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <Avatar name={session.user.name ?? 'U'} />
                  <div>
                    <div className="text-white text-sm font-medium">{session.user.name}</div>
                    <div className="text-stone-400 text-xs">{session.user.email}</div>
                  </div>
                </div>
                {!isAdmin && (
                  <>
                    <Link href="/orders" className="px-3 py-2.5 rounded-xl text-sm text-stone-200 hover:text-white hover:bg-stone-700/80 transition-colors">
                      📦 My Orders
                    </Link>
                    <Link href="/profile" className="px-3 py-2.5 rounded-xl text-sm text-stone-200 hover:text-white hover:bg-stone-700/80 transition-colors">
                      👤 My Profile
                    </Link>
                  </>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-2.5 rounded-xl text-sm text-stone-300 hover:text-red-400 hover:bg-stone-700/80 transition-colors text-left"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
