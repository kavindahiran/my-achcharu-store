'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

const CONTACT_PHONE = '+97431120638'
const CONTACT_DISPLAY = '+974 3112 0638'

const BANKS = [
  {
    name:        'QNB',
    accountName: process.env.NEXT_PUBLIC_QNB_ACCOUNT_NAME ?? '',
    iban:        process.env.NEXT_PUBLIC_QNB_IBAN ?? '',
  },
  {
    name:        'CBQ',
    accountName: process.env.NEXT_PUBLIC_CBQ_ACCOUNT_NAME ?? '',
    iban:        process.env.NEXT_PUBLIC_CBQ_IBAN ?? '',
  },
  {
    name:        'Doha Bank',
    accountName: process.env.NEXT_PUBLIC_DOHA_BANK_ACCOUNT_NAME ?? '',
    iban:        process.env.NEXT_PUBLIC_DOHA_BANK_IBAN ?? '',
  },
].filter(b => b.iban)

type Order = {
  id:            string
  orderNumber:   string
  status:        string
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  totalPriceQAR: number
  createdAt:     string
  deliveryDetails: {
    recipientName: string
    contactPhone:  string
    zone:          string
    street:        string
    building:      string
    apartmentUnit: string | null
    directions:    string | null
  } | null
  payment: {
    id:              string
    paymentStatus:   string
    receiptImageUrl: string | null
    bankName:        string | null
    transferReference: string | null
  } | null
  custom: {
    fruits:       { fruit: string; name: string; emoji: string }[]
    spice:        { label: string; emoji: string } | null
    extraSweet:   boolean
    extraSour:    boolean
    extraMustard: boolean
    extraGarlic:  boolean
    customNotes:  string | null
    addOns:       { name: string; quantity: number; subtotal: number }[]
    totalPriceQAR: number
  } | null
}

function Icon({ src, textClass = 'text-lg', imgClass = 'w-5 h-5' }: { src: string; textClass?: string; imgClass?: string }) {
  if (src.startsWith('/') || src.startsWith('http'))
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-full`} />
  return <span className={textClass}>{src}</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="text-xs text-amber-500 hover:text-amber-400 transition-colors ml-2 shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function ConfirmationPage() {
  const { id }    = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Receipt upload state
  const fileRef       = useRef<HTMLInputElement>(null)
  const [bankName, setBankName]           = useState('')
  const [ref_, setRef_]                   = useState('')
  const [uploadFile, setUploadFile]       = useState<File | null>(null)
  const [uploading, setUploading]         = useState(false)
  const [uploadError, setUploadError]     = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true)
        else setOrder(d)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile || !order) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('receipt', uploadFile)
      fd.append('orderId', order.id)
      if (bankName) fd.append('bankName', bankName)
      if (ref_)     fd.append('transferReference', ref_)

      const res = await fetch('/api/payments/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUploadSuccess(true)
      setOrder(prev => prev ? {
        ...prev,
        payment: prev.payment ? {
          ...prev.payment,
          receiptImageUrl: data.receiptImageUrl,
          paymentStatus: 'PENDING_VERIFICATION',
        } : prev.payment,
      } : prev)
    } catch (e: any) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading your order…</p>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-300">Order not found.</p>
        <Link href="/customize" className="text-amber-400 hover:text-amber-300 text-sm underline">
          Start a new order
        </Link>
      </div>
    )
  }

  const modifiers = [
    order.custom?.extraSweet   && 'Extra Sweet',
    order.custom?.extraSour    && 'Extra Sour',
    order.custom?.extraMustard && 'Extra Mustard',
    order.custom?.extraGarlic  && 'Extra Garlic',
  ].filter(Boolean) as string[]

  const receiptUploaded = !!order.payment?.receiptImageUrl || uploadSuccess

  // ── helpers ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-950">

      {/* Hero */}
      <section className="bg-stone-900 border-b border-stone-800 py-10 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Order Placed!</span>
        <h1 className="font-display text-3xl text-white font-bold mt-2">Thank You!</h1>
        <p className="text-stone-300 text-sm mt-2 max-w-sm mx-auto">
          Your custom achcharu is confirmed. Complete the payment below.
        </p>
        <div className="mt-4 inline-block bg-stone-800 border border-stone-700 rounded-xl px-6 py-2">
          <span className="text-stone-400 text-xs">Order Number</span>
          <div className="text-amber-400 font-bold text-lg tracking-widest">{order.orderNumber}</div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* ── QR card ── */}
        <OrderQR order={order} />

        {/* ── Payment section: Bank Transfer or COD ── */}
        {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
          <div className="bg-stone-900 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💵</span>
              <div>
                <h2 className="text-white font-bold text-lg">Cash on Delivery</h2>
                <p className="text-stone-300 text-sm mt-0.5">
                  Have <span className="text-amber-400 font-bold">QAR {order.totalPriceQAR.toFixed(2)}</span> ready when your order arrives. No upfront payment needed.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏦</span>
                <div>
                  <h2 className="text-white font-bold text-lg">Bank Transfer</h2>
                  <p className="text-stone-300 text-sm">Transfer QAR {order.totalPriceQAR.toFixed(2)} to any of the accounts below.</p>
                </div>
              </div>

              {BANKS.length === 0 ? (
                <p className="text-stone-400 text-sm">Bank details not configured yet. Please contact us directly.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {BANKS.map(bank => (
                    <div key={bank.name} className="bg-stone-800 rounded-xl p-4">
                      <div className="text-amber-300 font-semibold text-sm mb-2">{bank.name}</div>
                      {bank.accountName && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-300">Account Name</span>
                          <span className="text-stone-200 font-medium">{bank.accountName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-stone-300">IBAN</span>
                        <div className="flex items-center">
                          <span className="text-stone-200 font-mono text-xs">{bank.iban}</span>
                          <CopyButton text={bank.iban} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-xs leading-relaxed">
                Include your order number <strong>{order.orderNumber}</strong> as the transfer reference so we can match your payment.
              </div>
            </div>

            {/* ── Receipt upload ── */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-1">Upload Transfer Receipt</h2>
              <p className="text-stone-300 text-sm mb-5">
                After transferring, upload your receipt here. We verify within 2 hours and will contact you to confirm.
              </p>

          {receiptUploaded ? (
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-500/30 rounded-xl p-4">
              <span className="text-2xl">✅</span>
              <div>
                <div className="text-green-400 font-semibold text-sm">Receipt received</div>
                <div className="text-stone-300 text-xs mt-0.5">We&apos;ll verify your payment and reach out to confirm your order.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-400 text-xs font-medium">Bank Used</label>
                  <select
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">Select bank…</option>
                    {BANKS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-400 text-xs font-medium">Transfer Reference</label>
                  <input
                    type="text"
                    value={ref_}
                    onChange={e => setRef_(e.target.value)}
                    placeholder="Transaction ID…"
                    className="w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* File picker */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  uploadFile
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-stone-700 hover:border-stone-500 bg-stone-950'
                }`}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">📎</span>
                    <div className="text-left">
                      <div className="text-stone-200 text-sm font-medium">{uploadFile.name}</div>
                      <div className="text-stone-400 text-xs">{(uploadFile.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                      className="ml-2 text-stone-400 hover:text-red-400 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2 opacity-40">🖼</div>
                    <div className="text-stone-400 text-sm">Click to choose receipt image</div>
                    <div className="text-stone-400 text-xs mt-1">JPG, PNG, WebP — max 2 MB</div>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {uploadError && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                  {uploadError === 'Unauthorized'
                    ? <span>Please <Link href={`/login?next=/orders/${id}/confirmation`} className="underline text-amber-400">sign in</Link> to upload your receipt.</span>
                    : uploadError
                  }
                </div>
              )}

              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                  uploadFile && !uploading
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                {uploading ? 'Uploading…' : 'Submit Receipt'}
              </button>
            </form>
          )}
            </div>
          </>
        )}

        {/* ── Order summary ── */}
        {order.custom && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {order.custom.fruits.map(f => (
                <span key={f.fruit} className="inline-flex items-center gap-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-full">
                  <Icon src={f.emoji} textClass="text-sm" imgClass="w-4 h-4" /> {f.name}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-2 text-sm border-t border-stone-800 pt-4">
              {order.custom.spice && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-stone-400">Spice</span>
                  <span className="text-stone-200 inline-flex items-center gap-1.5">
                    <Icon src={order.custom.spice.emoji} textClass="text-sm" imgClass="w-4 h-4" />
                    {order.custom.spice.label}
                  </span>
                </div>
              )}
              {modifiers.length > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-stone-400">Modifiers</span>
                  <span className="text-stone-200">{modifiers.join(', ')}</span>
                </div>
              )}
              {order.custom.addOns.map(a => (
                <div key={a.name} className="flex items-center justify-between gap-4">
                  <span className="text-stone-400">{a.name} ×{a.quantity}</span>
                  <span className="text-amber-400">+QAR {a.subtotal.toFixed(2)}</span>
                </div>
              ))}
              {order.custom.customNotes && (
                <div className="text-stone-400 text-xs bg-stone-800 rounded-lg px-3 py-2 mt-1 leading-relaxed">
                  📝 {order.custom.customNotes}
                </div>
              )}
            </div>

            <div className="border-t border-stone-800 mt-4 pt-4 flex items-center justify-between">
              <span className="text-stone-400 text-sm">Total</span>
              <span className="text-amber-400 font-bold text-2xl">QAR {order.totalPriceQAR.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── Delivery address ── */}
        {order.deliveryDetails && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Delivery Address</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Name</span>
                <span className="text-stone-200">{order.deliveryDetails.recipientName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Phone</span>
                <span className="text-stone-200">{order.deliveryDetails.contactPhone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Zone</span>
                <span className="text-stone-200">{order.deliveryDetails.zone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Street</span>
                <span className="text-stone-200">{order.deliveryDetails.street}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Building</span>
                <span className="text-stone-200">
                  {order.deliveryDetails.building}
                  {order.deliveryDetails.apartmentUnit && `, ${order.deliveryDetails.apartmentUnit}`}
                </span>
              </div>
              {order.deliveryDetails.directions && (
                <div className="text-stone-400 text-xs bg-stone-800 rounded-lg px-3 py-2 mt-1 leading-relaxed">
                  📍 {order.deliveryDetails.directions}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/customize" className="text-stone-400 hover:text-stone-200 text-sm transition-colors underline">
            Place another order
          </Link>
        </div>

      </div>
    </div>
  )
}

// ─── QR card component ────────────────────────────────────────────────────────

function OrderQR({ order }: { order: Pick<Order, 'orderNumber' | 'totalPriceQAR' | 'paymentMethod' | 'status'> }) {
  const whatsappText = encodeURIComponent(
    `Hi! I placed an order on My Achcharu.\n` +
    `Order: ${order.orderNumber}\n` +
    `Total: QAR ${Number(order.totalPriceQAR).toFixed(2)}\n` +
    `Payment: ${order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery'}`
  )
  const waUrl = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${whatsappText}`

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-1">Contact Us</h2>
      <p className="text-stone-300 text-sm mb-5">
        Scan the QR to open WhatsApp with your order details pre-filled, or call/message us directly.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* QR code */}
        <div className="shrink-0 bg-white rounded-2xl p-4 shadow-lg">
          <QRCodeSVG
            value={waUrl}
            size={160}
            bgColor="#ffffff"
            fgColor="#1c1917"
            level="M"
          />
          <p className="text-stone-400 text-xs text-center mt-2 font-medium">WhatsApp</p>
        </div>

        {/* Contact details */}
        <div className="flex flex-col gap-3 w-full">
          <div className="bg-stone-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <div className="text-stone-300 text-xs mb-0.5">WhatsApp</div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 font-semibold text-sm transition-colors"
              >
                {CONTACT_DISPLAY}
              </a>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0"
            >
              Open Chat →
            </a>
          </div>

          <div className="bg-stone-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div className="flex-1">
              <div className="text-stone-300 text-xs mb-0.5">Phone</div>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="text-amber-400 hover:text-amber-300 font-semibold text-sm transition-colors"
              >
                {CONTACT_DISPLAY}
              </a>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-xs leading-relaxed">
            Reference your order number <strong>{order.orderNumber}</strong> when you contact us.
          </div>
        </div>

      </div>
    </div>
  )
}
