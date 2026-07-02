'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

const QATAR_ZONES = [
  'Al Sadd', 'West Bay', 'Msheireb', 'Al Waab', 'Al Rayyan', 'Al Dafna',
  'Al Hilal', 'Al Mansoura', 'Al Mirqab', 'Al Nasr', 'Al Thumama',
  'Barwa City', 'Education City', 'Lusail', 'Madinat Khalifa', 'Muaither',
  'Old Airport', 'The Pearl-Qatar', 'Wakrah', 'Wukair',
]

type Summary = {
  id: string
  fruits:       { fruit: string; name: string; emoji: string }[]
  spice:        { label: string; emoji: string } | null
  extraSweet:   boolean
  extraSour:    boolean
  extraMustard: boolean
  extraGarlic:  boolean
  customNotes:  string | null
  addOns:       { name: string; quantity: number; subtotal: number }[]
  totalPriceQAR: number
}

type PaymentMethod = 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'

function Icon({ src, textClass = 'text-lg', imgClass = 'w-5 h-5' }: { src: string; textClass?: string; imgClass?: string }) {
  if (src.startsWith('/') || src.startsWith('http'))
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-full`} />
  return <span className={textClass}>{src}</span>
}

const inputClass = 'w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-stone-400 text-xs font-medium">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-stone-500 shrink-0">{label}</span>
      <span className="text-stone-200 text-right">{children}</span>
    </div>
  )
}

export default function CheckoutContent({ customId }: { customId: string }) {
  const router = useRouter()

  const [summary, setSummary]       = useState<Summary | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY')
  const [locationLat, setLocationLat]     = useState<number | null>(null)
  const [locationLng, setLocationLng]     = useState<number | null>(null)

  const [form, setForm] = useState({
    recipientName: '',
    contactPhone:  '+974 ',
    zone:          '',
    street:        '',
    building:      '',
    apartmentUnit: '',
    directions:    '',
  })

  useEffect(() => {
    if (!customId) { router.replace('/customize'); return }
    fetch(`/api/orders/summary?customId=${customId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.replace('/customize'); return }
        setSummary(d)
      })
      .finally(() => setLoading(false))
  }, [customId])

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.recipientName.trim().length > 0 &&
    form.contactPhone.replace(/\D/g, '').length >= 8 &&
    form.zone.trim().length > 0 &&
    form.street.trim().length > 0 &&
    form.building.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !summary) return
    setSubmitting(true)
    setError('')
    try {
      const googleMapsLink = locationLat && locationLng
        ? `https://maps.google.com/?q=${locationLat},${locationLng}`
        : null

      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customId,
          paymentMethod,
          ...form,
          locationLat:    locationLat  ?? null,
          locationLng:    locationLng  ?? null,
          googleMapsLink,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order')
      router.push(`/orders/${data.order.id}/confirmation`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (!summary) return null

  const modifiers = [
    summary.extraSweet   && 'Extra Sweet',
    summary.extraSour    && 'Extra Sour',
    summary.extraMustard && 'Extra Mustard',
    summary.extraGarlic  && 'Extra Garlic',
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-stone-950">

      <section className="bg-stone-900 border-b border-stone-800 py-8 text-center">
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Almost There</span>
        <h1 className="font-display text-3xl text-white font-bold mt-2">Complete Your Order</h1>
        <p className="text-stone-400 text-sm mt-2">Fill in your delivery details — we&apos;ll bring your achcharu to you.</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-5">Delivery Details</h2>
            <div className="flex flex-col gap-4">

              <Field label="Full Name *">
                <input type="text" value={form.recipientName} onChange={e => set('recipientName', e.target.value)}
                  placeholder="e.g. Ahmed Al-Mahmoud" autoComplete="name" required className={inputClass} />
              </Field>

              <Field label="Contact Phone *">
                <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                  placeholder="+974 XXXX XXXX" autoComplete="tel" required className={inputClass} />
              </Field>

              <Field label="Zone / Area *">
                <input list="qatar-zones" value={form.zone} onChange={e => set('zone', e.target.value)}
                  placeholder="e.g. Al Sadd, West Bay, The Pearl…" required className={inputClass} />
                <datalist id="qatar-zones">
                  {QATAR_ZONES.map(z => <option key={z} value={z} />)}
                </datalist>
              </Field>

              <Field label="Street *">
                <input type="text" value={form.street} onChange={e => set('street', e.target.value)}
                  placeholder="Street name or number" required className={inputClass} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Building *">
                  <input type="text" value={form.building} onChange={e => set('building', e.target.value)}
                    placeholder="Building name / no." required className={inputClass} />
                </Field>
                <Field label="Flat / Unit">
                  <input type="text" value={form.apartmentUnit} onChange={e => set('apartmentUnit', e.target.value)}
                    placeholder="e.g. Apt 4B" className={inputClass} />
                </Field>
              </div>

              <Field label="Directions (optional)">
                <textarea value={form.directions} onChange={e => set('directions', e.target.value)}
                  placeholder="Any extra instructions to find you…" rows={2} className={`${inputClass} resize-none`} />
              </Field>

            </div>
          </div>

          {/* Map */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-lg">Pin Your Location</h2>
              {locationLat && locationLng && <span className="text-green-400 text-xs font-medium">✓ Location set</span>}
            </div>
            <p className="text-stone-400 text-sm mb-4">Drop a pin on your door — this helps us find you faster.</p>
            <LocationPicker lat={locationLat} lng={locationLng}
              onChange={(lat, lng) => { setLocationLat(lat); setLocationLng(lng) }} />
          </div>

          {/* Payment */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-800/40 p-4 opacity-50 cursor-not-allowed select-none">
                <span className="text-2xl mt-0.5 grayscale">🏦</span>
                <div>
                  <div className="font-semibold text-sm text-stone-400 flex items-center gap-2">
                    Bank Transfer
                    <span className="text-xs bg-stone-700 text-stone-500 px-2 py-0.5 rounded-full font-normal">Coming soon</span>
                  </div>
                  <div className="text-stone-600 text-xs mt-0.5">Transfer to QNB / CBQ / Doha Bank, then upload receipt.</div>
                </div>
              </div>
              <button type="button" onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                    : 'border-stone-700 bg-stone-800 hover:border-stone-500'
                }`}>
                <span className="text-2xl mt-0.5">💵</span>
                <div>
                  <div className={`font-semibold text-sm ${paymentMethod === 'CASH_ON_DELIVERY' ? 'text-amber-300' : 'text-stone-200'}`}>
                    Cash on Delivery
                  </div>
                  <div className="text-stone-500 text-xs mt-0.5">Pay in cash when your achcharu arrives.</div>
                </div>
                {paymentMethod === 'CASH_ON_DELIVERY' && <span className="ml-auto text-amber-500 text-sm font-bold shrink-0">✓</span>}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

          <button type="submit" disabled={!isValid || submitting}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-colors ${
              isValid && !submitting ? 'bg-amber-500 hover:bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-600 cursor-not-allowed'
            }`}>
            {submitting ? 'Placing Order…' : `Place Order — QAR ${summary.totalPriceQAR.toFixed(2)}`}
          </button>

        </form>

        {/* ── Right: Order summary ── */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 lg:sticky lg:top-8">
          <h2 className="text-white font-bold text-lg mb-4">Your Jar</h2>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {summary.fruits.map(f => (
              <span key={f.fruit} className="inline-flex items-center gap-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-full">
                <Icon src={f.emoji} textClass="text-sm" imgClass="w-4 h-4" /> {f.name}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 border-t border-stone-800 pt-4">
            {summary.spice && (
              <Row label="Spice">
                <span className="inline-flex items-center gap-1.5">
                  <Icon src={summary.spice.emoji} textClass="text-sm" imgClass="w-4 h-4" />
                  {summary.spice.label}
                </span>
              </Row>
            )}
            {modifiers.length > 0 && <Row label="Modifiers">{modifiers.join(', ')}</Row>}
            {summary.addOns.map(a => (
              <Row key={a.name} label={`${a.name} ×${a.quantity}`}>
                <span className="text-amber-400">+QAR {a.subtotal.toFixed(2)}</span>
              </Row>
            ))}
            {summary.customNotes && (
              <div className="text-stone-500 text-xs bg-stone-800 rounded-lg px-3 py-2 mt-1 leading-relaxed">
                📝 {summary.customNotes}
              </div>
            )}
          </div>
          <div className="border-t border-stone-800 mt-4 pt-4 flex items-center justify-between">
            <span className="text-stone-400 text-sm">Total</span>
            <span className="text-amber-400 font-bold text-2xl">QAR {summary.totalPriceQAR.toFixed(2)}</span>
          </div>
          <p className="text-stone-600 text-xs mt-3 text-center">Free delivery · No hidden fees</p>
        </div>

      </div>
    </div>
  )
}
