'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Read the callbackUrl directly from the browser URL at submit time
  function getCallbackUrl() {
    return new URLSearchParams(window.location.search).get('callbackUrl') || null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })

      if (result?.error) {
        setError('Incorrect email or password.')
        return
      }

      const callbackUrl = getCallbackUrl()
      if (callbackUrl) {
        window.location.href = callbackUrl
        return
      }

      const sessionRes = await fetch('/api/auth/session')
      const session    = await sessionRes.json()
      router.push(session?.user?.role === 'ADMIN' ? '/admin' : '/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Build the register link preserving the callbackUrl (rendered after mount so window is available)
  const registerHref = typeof window !== 'undefined' && window.location.search
    ? `/register${window.location.search}`
    : '/register'

  return (
    <div className="w-full max-w-sm">

      <div className="flex justify-center mb-8">
        <Link href="/">
          <div className="h-40 rounded-2xl overflow-hidden ring-1 ring-stone-700/60 hover:ring-amber-500/40 transition-all shadow-xl shadow-black/40">
            <Image
              src="/logo.png"
              alt="Mrs Achcharu"
              width={400}
              height={400}
              className="h-40 w-auto"
              priority
            />
          </div>
        </Link>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
        <h1 className="text-white font-semibold text-lg mb-6 text-center">Sign in to your account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Email</label>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Password</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors" />
          </div>
          {error && (
            <div className="bg-red-950/50 border border-red-800/60 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-bold py-3 rounded-xl transition-colors mt-1">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="text-center text-stone-600 text-sm mt-5">
        New customer?{' '}
        <Link href={registerHref} className="text-amber-500 hover:text-amber-400 transition-colors">
          Create an account
        </Link>
      </p>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
