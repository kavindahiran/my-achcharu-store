'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-stone-900 border-b border-stone-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-display text-xl text-amber-400 font-bold tracking-wide">
            Achcharu
          </span>
          <span className="text-xs text-stone-400 tracking-widest uppercase">
            Qatar
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            Home
          </Link>
          <Link href="/products" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            Shop
          </Link>
          <Link href="/customize" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            Customize
          </Link>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium px-4 py-2"
          >
            Login
          </Link>
          <Link
            href="/checkout"
            className="bg-amber-500 hover:bg-amber-400 text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Cart (0)
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-stone-300 hover:text-amber-400"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-stone-900 border-t border-stone-700 px-4 py-4 flex flex-col gap-4">
          <Link href="/" className="text-stone-300 hover:text-amber-400 text-sm font-medium" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/products" className="text-stone-300 hover:text-amber-400 text-sm font-medium" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link href="/customize" className="text-stone-300 hover:text-amber-400 text-sm font-medium" onClick={() => setMenuOpen(false)}>Customize</Link>
          <Link href="/login" className="text-stone-300 hover:text-amber-400 text-sm font-medium" onClick={() => setMenuOpen(false)}>Login</Link>
          <Link href="/checkout" className="bg-amber-500 text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Cart (0)</Link>
        </div>
      )}
    </nav>
  )
}
