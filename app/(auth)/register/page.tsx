'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  function getCallbackUrl(): string | null {
    return new URLSearchParams(window.location.search).get('callbackUrl') || null
  }

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.')
        return
      }

      // Auto sign in after registration
      await signIn('credentials', { email, password, redirect: false })

      const callbackUrl = getCallbackUrl()
      if (callbackUrl) {
        window.location.href = callbackUrl
      } else {
        router.push('/')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors'

  return (
    <div className="w-full max-w-sm">

      {/* Brand */}
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

      {/* Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
        <h1 className="text-white font-semibold text-lg mb-6 text-center">Create your account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Kavinda Perera"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-400 text-sm block mb-1.5">
              WhatsApp / Phone <span className="text-stone-600">(optional)</span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+974 5xxx xxxx"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-400 text-sm block mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/60 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-bold py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-stone-400 text-sm mt-5">
        Already have an account?{' '}
        <Link
          href={typeof window !== 'undefined' && window.location.search ? `/login${window.location.search}` : '/login'}
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Sign in
        </Link>
      </p>

    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
