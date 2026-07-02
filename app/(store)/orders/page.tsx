'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:          { label: 'Pending',          color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',   dot: 'bg-amber-400' },
  PROCESSING:       { label: 'Processing',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',     dot: 'bg-blue-400' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  COMPLETED:        { label: 'Completed',        color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',   dot: 'bg-green-400' },
  CANCELLED:        { label: 'Cancelled',        color: 'text-stone-500',  bg: 'bg-stone-800 border-stone-700',         dot: 'bg-stone-500' },
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING_VERIFICATION: 'Awaiting Verification',
  PAID:   'Paid',
  FAILED: 'Payment Failed',
}

function toTitleCase(key: string) {
  return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function parseFruits(baseFruitJson: string): string[] {
  try {
    return (JSON.parse(baseFruitJson) as string[]).map(toTitleCase)
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type Order = {
  id:            string
  orderNumber:   string
  status:        string
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  totalPriceQAR: string | number
  createdAt:     string
  items: Array<{
    customAchcharu: {
      baseFruit:    string
      spiceLevel:   string
      extraSweet:   boolean
      extraSour:    boolean
      extraMustard: boolean
      extraGarlic:  boolean
      customNotes:  string | null
    } | null
    product: { name: string } | null
  }>
  deliveryDetails: { zone: string; recipientName: string } | null
  payment: { paymentStatus: string } | null
}

export default function OrdersPage() {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data)
        else setError(data.error ?? 'Failed to load orders')
      })
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading your orders…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950">

      <section className="bg-stone-900 border-b border-stone-800 py-8 text-center">
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Your Achcharu</span>
        <h1 className="font-display text-3xl text-white font-bold mt-2">My Orders</h1>
        <p className="text-stone-300 text-sm mt-2">Track all your pickled goodness, past and present.</p>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-red-400 text-center">
            {error}
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-5">
            <img src="/jar.png" alt="" className="w-20 h-20 object-contain opacity-20" />
            <div>
              <p className="text-stone-300 text-lg font-medium">No orders yet</p>
              <p className="text-stone-400 text-sm mt-1">Build your first custom achcharu jar!</p>
            </div>
            <Link href="/customize"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Customize Your Jar →
            </Link>
          </div>
        )}

        {orders.length > 0 && (
          <div className="flex flex-col gap-4">
            {orders.map(order => {
              const cfg      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']
              const custom   = order.items.find(i => i.customAchcharu)?.customAchcharu ?? null
              const fruits   = custom ? parseFruits(custom.baseFruit) : []
              const mods     = custom ? [
                custom.extraSweet   && 'Extra Sweet',
                custom.extraSour    && 'Extra Sour',
                custom.extraMustard && 'Extra Mustard',
                custom.extraGarlic  && 'Extra Garlic',
              ].filter(Boolean) as string[] : []
              const total    = Number(order.totalPriceQAR)

              return (
                <div key={order.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-4">

                  {/* Order number + date + status badge */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-amber-400 font-bold font-mono tracking-wider text-sm">{order.orderNumber}</div>
                      <div className="text-stone-300 text-xs mt-0.5">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Fruit tags */}
                  {fruits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fruits.map(f => (
                        <span key={f} className="bg-stone-800 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Spice + modifiers */}
                  {(custom?.spiceLevel || mods.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {custom?.spiceLevel && (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-full">
                          🌶️ {toTitleCase(custom.spiceLevel)}
                        </span>
                      )}
                      {mods.map(m => (
                        <span key={m} className="bg-stone-800 border border-stone-700 text-stone-400 text-xs px-2.5 py-1 rounded-full">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: zone · payment · price · view */}
                  <div className="border-t border-stone-800 pt-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      {order.deliveryDetails?.zone && (
                        <span className="text-stone-400 text-xs">📍 {order.deliveryDetails.zone}</span>
                      )}
                      <span className="text-stone-400 text-xs">
                        {order.paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' : '🏦 Bank Transfer'}
                      </span>
                      {order.payment && (
                        <span className={`text-xs ${
                          order.payment.paymentStatus === 'PAID'    ? 'text-green-500' :
                          order.payment.paymentStatus === 'FAILED'  ? 'text-red-400'   :
                          'text-amber-400/70'
                        }`}>
                          {PAYMENT_STATUS_LABEL[order.payment.paymentStatus] ?? order.payment.paymentStatus}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-amber-400 font-bold text-lg">QAR {total.toFixed(2)}</span>
                      <Link
                        href={`/orders/${order.id}/confirmation`}
                        className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        <div className="text-center pt-10">
          <Link href="/customize" className="text-stone-300 hover:text-white text-sm transition-colors">
            + Place another order
          </Link>
        </div>

      </div>
    </div>
  )
}
