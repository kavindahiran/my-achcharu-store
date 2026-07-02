'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Payment = {
  id:                string
  paymentStatus:     'PENDING_VERIFICATION' | 'PAID' | 'FAILED'
  paymentMethod:     'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  receiptImageUrl:   string | null
  bankName:          string | null
  transferReference: string | null
  adminNotes:        string | null
  verifiedAt:        string | null
  createdAt:         string
  order: {
    id:            string
    orderNumber:   string
    status:        string
    totalPriceQAR: string | number
    user: { name: string; email: string; phone: string | null } | null
    deliveryDetails: {
      recipientName: string
      contactPhone:  string
      zone:          string
    } | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'PENDING_VERIFICATION', label: 'Pending',  color: 'text-amber-400'  },
  { key: 'PAID',                 label: 'Verified', color: 'text-green-400'  },
  { key: 'FAILED',               label: 'Rejected', color: 'text-red-400'    },
]

export default function AdminPaymentsPage() {
  const [payments,  setPayments]  = useState<Payment[]>([])
  const [tab,       setTab]       = useState<string>('PENDING_VERIFICATION')
  const [loading,   setLoading]   = useState(true)
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [lightbox,  setLightbox]  = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback((status: string) => {
    setLoading(true)
    fetch(`/api/admin/payments?status=${status}`)
      .then(r => r.json())
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  async function verify(paymentId: string, paymentStatus: 'PAID' | 'FAILED', adminNotes?: string) {
    setUpdating(paymentId)
    try {
      const res = await fetch('/api/admin/payments', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentId, paymentStatus, adminNotes }),
      })
      if (res.ok) {
        showToast(paymentStatus === 'PAID' ? 'Payment verified ✓' : 'Payment rejected')
        load(tab)
      } else {
        showToast('Action failed', false)
      }
    } finally {
      setUpdating(null)
    }
  }

  const pendingCount = tab === 'PENDING_VERIFICATION' ? payments.length : undefined

  return (
    <div className="min-h-screen bg-stone-950 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
          toast.ok ? 'bg-green-600' : 'bg-red-700'
        }`}>
          <span>{toast.ok ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Receipt"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Payments</h1>
          <p className="text-stone-400 text-sm mt-1">Bank transfer receipt verification</p>
        </div>
        <button
          onClick={() => load(tab)}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                tab === t.key
                  ? 'bg-amber-500 text-stone-950 border-amber-500'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white hover:border-stone-600'
              }`}
            >
              {t.label}
              {t.key === 'PENDING_VERIFICATION' && pendingCount !== undefined && pendingCount > 0 && (
                <span className={`ml-2 text-xs font-bold ${tab === t.key ? 'text-stone-800' : 'text-amber-400'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-stone-500 text-sm text-center py-20">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-30">{tab === 'PAID' ? '✓' : tab === 'FAILED' ? '✗' : '🧾'}</div>
            <p className="text-stone-500 text-sm">
              {tab === 'PENDING_VERIFICATION' ? 'No pending receipts to review.' :
               tab === 'PAID'                 ? 'No verified payments yet.'      :
               'No rejected payments.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {payments.map(p => (
              <PaymentCard
                key={p.id}
                payment={p}
                updating={updating}
                onVerify={verify}
                onOpenReceipt={setLightbox}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Payment card ─────────────────────────────────────────────────────────────

function PaymentCard({
  payment, updating, onVerify, onOpenReceipt,
}: {
  payment:       Payment
  updating:      string | null
  onVerify:      (id: string, status: 'PAID' | 'FAILED', notes?: string) => void
  onOpenReceipt: (url: string) => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notes,      setNotes]      = useState('')
  const isBusy = updating === payment.id
  const isPending = payment.paymentStatus === 'PENDING_VERIFICATION'
  const customer  = payment.order.deliveryDetails?.recipientName ?? payment.order.user?.name ?? 'Unknown'

  return (
    <div className={`bg-stone-900 border rounded-2xl overflow-hidden ${
      isPending ? 'border-amber-500/20' : 'border-stone-800'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold font-mono text-sm">{payment.order.orderNumber}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            payment.paymentStatus === 'PENDING_VERIFICATION' ? 'bg-amber-500/20 text-amber-300' :
            payment.paymentStatus === 'PAID'                 ? 'bg-green-500/20 text-green-300'  :
            'bg-red-500/20 text-red-400'
          }`}>
            {payment.paymentStatus === 'PENDING_VERIFICATION' ? 'Awaiting Review' :
             payment.paymentStatus === 'PAID' ? '✓ Verified' : '✗ Rejected'}
          </span>
        </div>
        <span className="text-stone-500 text-xs">{timeAgo(payment.createdAt)}</span>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Customer + amount row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="text-white font-semibold text-sm">{customer}</div>
            {payment.order.user?.email && (
              <a href={`mailto:${payment.order.user.email}`}
                className="text-stone-400 hover:text-stone-300 text-xs transition-colors">
                {payment.order.user.email}
              </a>
            )}
            {(payment.order.deliveryDetails?.contactPhone ?? payment.order.user?.phone) && (
              <a href={`tel:${payment.order.deliveryDetails?.contactPhone ?? payment.order.user?.phone}`}
                className="text-amber-400 hover:text-amber-300 text-xs transition-colors">
                {payment.order.deliveryDetails?.contactPhone ?? payment.order.user?.phone}
              </a>
            )}
            {payment.order.deliveryDetails?.zone && (
              <span className="text-stone-500 text-xs mt-0.5">📍 {payment.order.deliveryDetails.zone}</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-amber-400 font-bold text-xl">
              QAR {Number(payment.order.totalPriceQAR).toFixed(2)}
            </div>
            <div className="text-stone-500 text-xs mt-0.5">🏦 Bank Transfer</div>
          </div>
        </div>

        {/* Transfer details row */}
        {(payment.bankName || payment.transferReference) && (
          <div className="bg-stone-800 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
            {payment.bankName && (
              <div className="flex flex-col gap-0.5">
                <span className="text-stone-500 text-xs">Bank</span>
                <span className="text-stone-200 font-medium">{payment.bankName}</span>
              </div>
            )}
            {payment.transferReference && (
              <div className="flex flex-col gap-0.5">
                <span className="text-stone-500 text-xs">Reference</span>
                <span className="text-stone-200 font-mono text-sm">{payment.transferReference}</span>
              </div>
            )}
          </div>
        )}

        {/* Receipt image */}
        {payment.receiptImageUrl ? (
          <div className="flex items-start gap-4">
            <button
              onClick={() => onOpenReceipt(payment.receiptImageUrl!)}
              className="shrink-0 relative group"
            >
              <img
                src={payment.receiptImageUrl}
                alt="Transfer receipt"
                className="w-24 h-24 object-cover rounded-xl border border-stone-700 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs bg-black/60 px-2 py-1 rounded-lg">View</span>
              </div>
            </button>
            <div className="text-stone-400 text-xs leading-relaxed mt-1">
              Receipt uploaded by customer.
              <br />Click to view full size.
            </div>
          </div>
        ) : (
          <div className="bg-stone-800/50 border border-stone-700/50 border-dashed rounded-xl p-4 text-center">
            <p className="text-stone-600 text-xs">No receipt uploaded yet</p>
          </div>
        )}

        {/* Admin notes (if already processed) */}
        {payment.adminNotes && (
          <div className="bg-stone-800 rounded-xl px-4 py-3 text-stone-400 text-xs">
            📝 {payment.adminNotes}
          </div>
        )}

        {/* Verified at */}
        {payment.verifiedAt && (
          <p className="text-stone-600 text-xs">
            {payment.paymentStatus === 'PAID' ? 'Verified' : 'Rejected'} on {formatDate(payment.verifiedAt)}
          </p>
        )}

        {/* Actions — only for pending */}
        {isPending && (
          <div className="border-t border-stone-800 pt-4 flex flex-col gap-3">

            {!rejectOpen ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onVerify(payment.id, 'PAID')}
                  disabled={isBusy}
                  className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                >
                  {isBusy ? '…' : '✓ Verify Payment'}
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={isBusy}
                  className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-red-900 border border-stone-700 hover:border-red-700 disabled:opacity-50 text-stone-300 hover:text-red-300 text-sm font-bold transition-colors"
                >
                  ✗ Reject
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Reason for rejection (optional)…"
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { onVerify(payment.id, 'FAILED', notes || undefined); setRejectOpen(false) }}
                    disabled={isBusy}
                    className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                  >
                    {isBusy ? '…' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => { setRejectOpen(false); setNotes('') }}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
