'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type DashboardData = {
  counts: {
    PENDING:          number
    PROCESSING:       number
    OUT_FOR_DELIVERY: number
    COMPLETED:        number
    CANCELLED:        number
  }
  pendingPayments: number
  totalRevenue:    number
  recentOrders: {
    id:            string
    orderNumber:   string
    status:        string
    paymentMethod: string
    totalPriceQAR: number
    createdAt:     string
    customerName:  string
    zone:          string
  }[]
}

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  PENDING:          { label: 'Pending',          dot: 'bg-amber-400',  text: 'text-amber-400'  },
  PROCESSING:       { label: 'Processing',       dot: 'bg-blue-400',   text: 'text-blue-400'   },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', dot: 'bg-orange-400', text: 'text-orange-400' },
  COMPLETED:        { label: 'Completed',        dot: 'bg-green-400',  text: 'text-green-400'  },
  CANCELLED:        { label: 'Cancelled',        dot: 'bg-stone-500',  text: 'text-stone-500'  },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminDashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500 text-sm">Loading dashboard…</p>
      </div>
    )
  }

  const totalActive = data.counts.PENDING + data.counts.PROCESSING + data.counts.OUT_FOR_DELIVERY

  return (
    <div className="min-h-screen bg-stone-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Dashboard</h1>
            <p className="text-stone-400 text-sm mt-1">Overview of your store</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            ↺ Refresh
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <div className="text-stone-500 text-xs font-medium mb-2">Active Orders</div>
            <div className="text-3xl font-bold text-white">{totalActive}</div>
            <div className="text-stone-500 text-xs mt-1">
              {data.counts.PENDING}p · {data.counts.PROCESSING}pr · {data.counts.OUT_FOR_DELIVERY}del
            </div>
          </div>

          <div className={`bg-stone-900 border rounded-2xl p-5 ${data.pendingPayments > 0 ? 'border-amber-500/30' : 'border-stone-800'}`}>
            <div className="text-stone-500 text-xs font-medium mb-2">Pending Payments</div>
            <div className={`text-3xl font-bold ${data.pendingPayments > 0 ? 'text-amber-400' : 'text-white'}`}>
              {data.pendingPayments}
            </div>
            {data.pendingPayments > 0 ? (
              <Link href="/admin/payments" className="text-amber-500 hover:text-amber-400 text-xs mt-1 block transition-colors">
                Review now →
              </Link>
            ) : (
              <div className="text-stone-600 text-xs mt-1">All clear</div>
            )}
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <div className="text-stone-500 text-xs font-medium mb-2">Completed Orders</div>
            <div className="text-3xl font-bold text-green-400">{data.counts.COMPLETED}</div>
            <div className="text-stone-500 text-xs mt-1">all time</div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <div className="text-stone-500 text-xs font-medium mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-amber-400">
              {data.totalRevenue.toFixed(0)}
            </div>
            <div className="text-stone-500 text-xs mt-1">QAR · completed only</div>
          </div>

        </div>

        {/* ── Order status breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Order Pipeline</h2>
            <div className="flex flex-col gap-3">
              {[
                { key: 'PENDING',          color: 'bg-amber-400',  label: 'Pending' },
                { key: 'PROCESSING',       color: 'bg-blue-400',   label: 'Processing' },
                { key: 'OUT_FOR_DELIVERY', color: 'bg-orange-400', label: 'Out for Delivery' },
                { key: 'COMPLETED',        color: 'bg-green-400',  label: 'Completed' },
                { key: 'CANCELLED',        color: 'bg-stone-600',  label: 'Cancelled' },
              ].map(s => {
                const count = data.counts[s.key as keyof typeof data.counts]
                const total = Object.values(data.counts).reduce((a, b) => a + b, 0)
                const pct   = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-24 text-stone-400 text-xs shrink-0">{s.label}</div>
                    <div className="flex-1 bg-stone-800 rounded-full h-2">
                      <div className={`${s.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-6 text-right text-stone-300 text-xs font-medium shrink-0">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Quick Links</h2>
            <div className="flex flex-col gap-2">
              {[
                { href: '/admin/orders',   icon: '📦', label: 'Manage Orders',   badge: totalActive > 0 ? totalActive : null },
                { href: '/admin/payments', icon: '🏦', label: 'Verify Payments',  badge: data.pendingPayments > 0 ? data.pendingPayments : null },
                { href: '/admin/products', icon: '/jar.png', label: 'Manage Products',  badge: null },
                { href: '/admin/pricing',  icon: '⚙️', label: 'Pricing & Config', badge: null },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 transition-colors group">
                  {l.icon.startsWith('/')
                    ? <img src={l.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
                    : <span className="text-base">{l.icon}</span>
                  }
                  <span className="flex-1 text-stone-300 group-hover:text-white text-sm transition-colors">{l.label}</span>
                  {l.badge !== null && (
                    <span className="text-xs bg-amber-500 text-stone-950 font-bold px-1.5 py-0.5 rounded-full">{l.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ── Recent orders ── */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-amber-500 hover:text-amber-400 text-xs transition-colors">
              View all →
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <p className="text-stone-600 text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-stone-800">
              {data.recentOrders.map(order => {
                const s = STATUS_STYLE[order.status] ?? STATUS_STYLE['PENDING']
                return (
                  <div key={order.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-xs font-medium">{order.orderNumber}</span>
                        <span className={`inline-flex items-center gap-1 text-xs ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>
                      <div className="text-stone-400 text-xs mt-0.5 truncate">
                        {order.customerName}{order.zone ? ` · ${order.zone}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-amber-400 font-bold text-sm">QAR {order.totalPriceQAR.toFixed(2)}</div>
                      <div className="text-stone-600 text-xs">{timeAgo(order.createdAt)}</div>
                    </div>
                    <Link href="/admin/orders"
                      className="shrink-0 text-stone-600 hover:text-stone-300 text-xs transition-colors">
                      →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
