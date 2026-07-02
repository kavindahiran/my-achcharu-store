'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Profile = {
  id:        string
  name:      string
  email:     string
  phone:     string | null
  createdAt: string
}

const inputClass = 'w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors'
const labelClass = 'text-stone-400 text-xs font-medium block mb-1.5'

export default function ProfilePage() {
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)

  // Profile form
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Password form
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwMsg,      setPwMsg]      = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setProfile(d)
          setName(d.name ?? '')
          setPhone(d.phone ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      const res  = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileMsg({ text: data.error ?? 'Save failed', ok: false })
      } else {
        setProfile(data)
        setProfileMsg({ text: 'Profile updated', ok: true })
      }
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match', ok: false })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ text: 'Password must be at least 6 characters', ok: false })
      return
    }
    setPwSaving(true)
    try {
      const res  = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwMsg({ text: data.error ?? 'Failed to change password', ok: false })
      } else {
        setPwMsg({ text: 'Password changed successfully', ok: true })
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      }
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950">

      <section className="bg-stone-900 border-b border-stone-800 py-8 text-center">
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Account</span>
        <h1 className="font-display text-3xl text-white font-bold mt-2">My Profile</h1>
        <p className="text-stone-300 text-sm mt-2">Manage your account details and password.</p>
      </section>

      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* ── Profile details ── */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Account Details</h2>

          {/* Email — read only */}
          <div className="mb-5">
            <label className={labelClass}>Email</label>
            <div className="w-full bg-stone-800/50 border border-stone-700/50 text-stone-500 rounded-xl px-4 py-3 text-sm">
              {profile?.email}
            </div>
            <p className="text-stone-400 text-xs mt-1">Email cannot be changed.</p>
          </div>

          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>WhatsApp / Phone <span className="text-stone-600">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+974 5xxx xxxx"
                className={inputClass}
              />
            </div>

            {profileMsg && (
              <div className={`text-sm rounded-xl px-4 py-3 ${
                profileMsg.ok
                  ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                  : 'bg-red-900/30 border border-red-500/30 text-red-400'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-bold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ── Change password ── */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Change Password</h2>

          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {pwMsg && (
              <div className={`text-sm rounded-xl px-4 py-3 ${
                pwMsg.ok
                  ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                  : 'bg-red-900/30 border border-red-500/30 text-red-400'
              }`}>
                {pwMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="w-full bg-stone-800 hover:bg-stone-700 disabled:opacity-50 border border-stone-700 text-stone-200 font-bold py-3 rounded-xl transition-colors"
            >
              {pwSaving ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* ── Quick links ── */}
        <div className="flex gap-3">
          <Link href="/orders"
            className="flex-1 text-center py-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-600 text-stone-300 hover:text-white text-sm transition-colors">
            📦 My Orders
          </Link>
          <Link href="/customize"
            className="flex-1 text-center py-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-400 text-sm transition-colors">
            <img src="/jar.png" alt="" className="w-4 h-4 object-contain inline-block mr-1 align-middle" /> New Order
          </Link>
        </div>

      </div>
    </div>
  )
}
