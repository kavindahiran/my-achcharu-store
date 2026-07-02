'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FruitMeta  = { fruit: string; name: string; emoji: string }
type SpiceMeta  = { key: string; label: string; emoji: string }

type Order = {
  id:            string
  orderNumber:   string
  status:        'PENDING' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED'
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  totalPriceQAR: string | number
  createdAt:     string
  user: { name: string; email: string; phone: string | null } | null
  items: {
    customAchcharu: {
      baseFruit:    string
      spiceLevel:   string
      extraSweet:   boolean
      extraSour:    boolean
      extraMustard: boolean
      extraGarlic:  boolean
      customNotes:  string | null
      addOns: { addOn: { name: string }; quantity: number }[]
    } | null
  }[]
  deliveryDetails: {
    recipientName:  string
    contactPhone:   string
    zone:           string
    street:         string
    building:       string
    apartmentUnit:  string | null
    directions:     string | null
    googleMapsLink: string | null
  } | null
  payment: {
    id:               string
    paymentStatus:    'PENDING_VERIFICATION' | 'PAID' | 'FAILED'
    paymentMethod:    string
    receiptImageUrl:  string | null
    bankName:         string | null
    transferReference:string | null
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:          'Pending',
  PROCESSING:       'Processing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  COMPLETED:        'Completed',
  CANCELLED:        'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  PROCESSING:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  COMPLETED:        'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELLED:        'bg-red-500/20 text-red-400 border-red-500/30',
}

const PAY_STATUS_COLORS: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-yellow-500/20 text-yellow-300',
  PAID:   'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-400',
}

const NEXT_STATUSES: Record<string, { label: string; value: string; color: string }[]> = {
  PENDING:          [{ label: 'Confirm →', value: 'PROCESSING', color: 'bg-blue-600 hover:bg-blue-500' }, { label: 'Cancel', value: 'CANCELLED', color: 'bg-red-800 hover:bg-red-700' }],
  PROCESSING:       [{ label: 'Out for Delivery →', value: 'OUT_FOR_DELIVERY', color: 'bg-purple-600 hover:bg-purple-500' }, { label: 'Cancel', value: 'CANCELLED', color: 'bg-red-800 hover:bg-red-700' }],
  OUT_FOR_DELIVERY: [{ label: 'Mark Delivered ✓', value: 'COMPLETED', color: 'bg-green-700 hover:bg-green-600' }],
  COMPLETED:        [],
  CANCELLED:        [],
}

const ALL_FILTERS = ['ALL', 'PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Icon({ src, textClass = 'text-base', imgClass = 'w-5 h-5' }: { src: string; textClass?: string; imgClass?: string }) {
  if (src && (src.startsWith('/') || src.startsWith('http')))
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-full inline`} />
  return <span className={textClass}>{src}</span>
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [fruits, setFruits]       = useState<Record<string, FruitMeta>>({})
  const [spices, setSpices]       = useState<Record<string, SpiceMeta>>({})
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setFilter] = useState('ALL')
  const [updating, setUpdating]   = useState<string | null>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(() => {
    setLoading(true)
    return Promise.all([
      fetch('/api/admin/orders').then(r => r.json()),
      fetch('/api/customize').then(r => r.json()),
    ]).then(([ordersData, customizeData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : [])

      const fm: Record<string, FruitMeta> = {}
      customizeData.fruits?.forEach((f: FruitMeta) => { fm[f.fruit] = f })
      setFruits(fm)

      const sm: Record<string, SpiceMeta> = {}
      customizeData.spiceOptions?.forEach((s: SpiceMeta) => { sm[s.key] = s })
      setSpices(sm)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        showToast(`Order moved to ${STATUS_LABELS[status]}`)
        await load()
      } else {
        showToast('Failed to update order', false)
      }
    } finally {
      setUpdating(null)
    }
  }

  async function verifyPayment(paymentId: string, paymentStatus: 'PAID' | 'FAILED') {
    setUpdating(paymentId)
    try {
      await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, paymentStatus }),
      })
      showToast(paymentStatus === 'PAID' ? 'Payment verified ✓' : 'Payment rejected')
      await load()
    } finally {
      setUpdating(null)
    }
  }

  const filtered = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  // Stats
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-stone-950 p-6">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white transition-all ${
          toast.ok ? 'bg-green-600' : 'bg-red-700'
        }`}>
          <span>{toast.ok ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Orders</h1>
          <p className="text-stone-400 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <a
          href="/admin/pricing"
          className="shrink-0 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
        >
          ⚙️ Pricing
        </a>
      </div>

      <div className="max-w-5xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending',    key: 'PENDING',          color: 'text-yellow-400' },
            { label: 'Processing', key: 'PROCESSING',       color: 'text-blue-400' },
            { label: 'Delivering', key: 'OUT_FOR_DELIVERY', color: 'text-purple-400' },
            { label: 'Completed',  key: 'COMPLETED',        color: 'text-green-400' },
          ].map(s => (
            <div key={s.key} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{counts[s.key] ?? 0}</div>
              <div className="text-stone-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ALL_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All' : STATUS_LABELS[f]}
              {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}

          <button
            onClick={load}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            ↺ Refresh
          </button>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-stone-500 text-sm text-center py-20">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-stone-600 text-sm text-center py-20">No orders found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                fruits={fruits}
                spices={spices}
                updating={updating}
                onStatusChange={updateOrderStatus}
                onVerifyPayment={verifyPayment}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order, fruits, spices, updating, onStatusChange, onVerifyPayment,
}: {
  order: Order
  fruits: Record<string, FruitMeta>
  spices: Record<string, SpiceMeta>
  updating: string | null
  onStatusChange: (id: string, status: string) => void
  onVerifyPayment: (id: string, status: 'PAID' | 'FAILED') => void
}) {
  const custom = order.items.find(i => i.customAchcharu)?.customAchcharu ?? null
  const baseFruits: string[] = custom ? JSON.parse(custom.baseFruit) : []
  const spice = custom ? spices[custom.spiceLevel] : null

  const modifiers = custom ? [
    custom.extraSweet   && 'Extra Sweet',
    custom.extraSour    && 'Extra Sour',
    custom.extraMustard && 'Extra Mustard',
    custom.extraGarlic  && 'Extra Garlic',
  ].filter(Boolean) as string[] : []

  const isBusy = updating === order.id || updating === order.payment?.id

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold font-mono text-sm">{order.orderNumber}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <span className="text-stone-500 text-xs">{timeAgo(order.createdAt)}</span>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* ── Customer ── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="text-white font-semibold text-sm">
              {order.deliveryDetails?.recipientName ?? order.user?.name ?? 'Unknown'}
            </div>
            <a
              href={`tel:${order.deliveryDetails?.contactPhone ?? order.user?.phone}`}
              className="text-amber-400 hover:text-amber-300 text-xs transition-colors"
            >
              {order.deliveryDetails?.contactPhone ?? order.user?.phone ?? '—'}
            </a>
            {order.user?.email && (
              <a
                href={`mailto:${order.user.email}`}
                className="text-stone-400 hover:text-stone-300 text-xs transition-colors"
              >
                {order.user.email}
              </a>
            )}
          </div>
          <div className="text-amber-400 font-bold text-lg">
            QAR {Number(order.totalPriceQAR).toFixed(2)}
          </div>
        </div>

        {/* ── Custom build ── */}
        {custom && (
          <div className="bg-stone-800 rounded-xl p-4 flex flex-col gap-2">
            {/* Fruits */}
            <div className="flex flex-wrap gap-1.5">
              {baseFruits.map(key => {
                const f = fruits[key]
                return (
                  <span key={key} className="inline-flex items-center gap-1 bg-stone-700 text-stone-200 text-xs px-2 py-0.5 rounded-full">
                    {f ? <Icon src={f.emoji} textClass="text-sm" imgClass="w-4 h-4" /> : null}
                    {f?.name ?? key}
                  </span>
                )
              })}
              {spice && (
                <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 text-xs px-2 py-0.5 rounded-full">
                  <Icon src={spice.emoji} textClass="text-sm" imgClass="w-4 h-4" />
                  {spice.label}
                </span>
              )}
            </div>

            {/* Modifiers */}
            {modifiers.length > 0 && (
              <div className="text-stone-400 text-xs">{modifiers.join(' · ')}</div>
            )}

            {/* Add-ons */}
            {custom.addOns.length > 0 && (
              <div className="text-stone-400 text-xs">
                {custom.addOns.map(a => `${a.addOn.name} ×${a.quantity}`).join(', ')}
              </div>
            )}

            {/* Notes */}
            {custom.customNotes && (
              <div className="text-stone-500 text-xs border-t border-stone-700 pt-2 mt-1">
                📝 {custom.customNotes}
              </div>
            )}
          </div>
        )}

        {/* ── Delivery address ── */}
        {order.deliveryDetails && (
          <div className="flex items-start justify-between gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <div className="text-stone-300">
                {order.deliveryDetails.zone} · {order.deliveryDetails.street}
              </div>
              <div className="text-stone-400 text-xs">
                {order.deliveryDetails.building}
                {order.deliveryDetails.apartmentUnit && `, ${order.deliveryDetails.apartmentUnit}`}
              </div>
              {order.deliveryDetails.directions && (
                <div className="text-stone-500 text-xs mt-0.5">📍 {order.deliveryDetails.directions}</div>
              )}
            </div>
            {order.deliveryDetails.googleMapsLink && (
              <a
                href={order.deliveryDetails.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                🗺 Maps
              </a>
            )}
          </div>
        )}

        {/* ── Payment ── */}
        <div className="flex flex-col gap-3 border-t border-stone-800 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span>{order.paymentMethod === 'BANK_TRANSFER' ? '🏦' : '💵'}</span>
              <span className="text-stone-300">
                {order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery'}
              </span>
              {order.payment && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_STATUS_COLORS[order.payment.paymentStatus]}`}>
                  {order.payment.paymentStatus === 'PENDING_VERIFICATION' ? 'Pending' :
                   order.payment.paymentStatus === 'PAID' ? 'Paid' : 'Failed'}
                </span>
              )}
            </div>
          </div>

          {/* Receipt for bank transfer */}
          {order.payment?.receiptImageUrl && (
            <div className="flex items-center gap-3">
              <a
                href={order.payment.receiptImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <img
                  src={order.payment.receiptImageUrl}
                  alt="Receipt"
                  className="w-16 h-16 object-cover rounded-lg border border-stone-700 hover:opacity-80 transition-opacity"
                />
              </a>
              <div className="text-xs text-stone-400 flex flex-col gap-0.5">
                {order.payment.bankName && <span>Bank: {order.payment.bankName}</span>}
                {order.payment.transferReference && <span>Ref: {order.payment.transferReference}</span>}
              </div>
            </div>
          )}

          {/* Verify payment buttons — bank transfer only, pending only */}
          {order.payment &&
           order.paymentMethod === 'BANK_TRANSFER' &&
           order.payment.paymentStatus === 'PENDING_VERIFICATION' && (
            <div className="flex gap-2">
              <button
                onClick={() => onVerifyPayment(order.payment!.id, 'PAID')}
                disabled={isBusy}
                className="flex-1 py-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                ✓ Verify Payment
              </button>
              <button
                onClick={() => onVerifyPayment(order.payment!.id, 'FAILED')}
                disabled={isBusy}
                className="flex-1 py-2 rounded-lg bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          )}
        </div>

        {/* ── WhatsApp quick-notify (shown on OUT_FOR_DELIVERY orders) ── */}
        {order.status === 'OUT_FOR_DELIVERY' && order.deliveryDetails?.contactPhone && (() => {
          const phone = order.deliveryDetails!.contactPhone.replace(/\D/g, '')
          const name  = order.deliveryDetails!.recipientName
          const text  = encodeURIComponent(
            `Hi ${name}, your My Achcharu order ${order.orderNumber} is on its way! 🛵 Our delivery team will reach you shortly. Thank you!`
          )
          return (
            <div className="border-t border-stone-800 pt-3">
              <a
                href={`https://wa.me/${phone}?text=${text}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-xs font-bold transition-colors"
              >
                💬 WhatsApp Customer — On the Way!
              </a>
            </div>
          )
        })()}

        {/* ── Status actions ── */}
        {NEXT_STATUSES[order.status]?.length > 0 && (
          <div className="flex gap-2 border-t border-stone-800 pt-3">
            {NEXT_STATUSES[order.status].map(action => (
              <button
                key={action.value}
                onClick={() => onStatusChange(order.id, action.value)}
                disabled={isBusy}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 ${action.color}`}
              >
                {isBusy && updating === order.id ? '…' : action.label}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
