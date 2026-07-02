'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id:          string
  name:        string
  slug:        string
  description: string
  priceQAR:    string | number
  imageUrl:    string
  stockLevel:  number
  isAvailable: boolean
  isFeatured:  boolean
  ingredients: string[]
}

// ─── Icon helper ──────────────────────────────────────────────────────────────

function Icon({ src, textSize = 'text-2xl', imgClass = 'w-10 h-10' }: { src: string; textSize?: string; imgClass?: string }) {
  if (!src) return <img src="/jar.png" alt="" className={`${imgClass} object-contain`} />
  if (src.startsWith('/') || src.startsWith('http'))
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-xl`} />
  return <span className={textSize}>{src}</span>
}

// ─── Image / emoji picker ─────────────────────────────────────────────────────

function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isUrl      = value.startsWith('/') || value.startsWith('http')
  const [mode, setMode]           = useState<'emoji' | 'image'>(isUrl ? 'image' : 'emoji')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onChange(json.url)
      setMode('image')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const inputClass = 'w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {(['emoji', 'image'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`capitalize text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              mode === m
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-stone-700 text-stone-400 hover:border-stone-500'
            }`}>
            {m}
          </button>
        ))}
      </div>

      {mode === 'emoji' ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="/jar.png or paste emoji" className={inputClass} />
      ) : (
        <div className="flex items-center gap-3">
          {isUrl && value && (
            <img src={value} alt="" className="w-10 h-10 rounded-xl object-cover border border-stone-700 shrink-0" />
          )}
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 text-xs bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            {uploading ? 'Uploading…' : isUrl ? '↺ Replace image' : '+ Upload image'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

// ─── Blank form state ─────────────────────────────────────────────────────────

const BLANK = {
  name:        '',
  description: '',
  priceQAR:    '',
  imageUrl:    '/jar.png',
  stockLevel:  '0',
  isAvailable: true,
  isFeatured:  false,
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [form,      setForm]      = useState(BLANK)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name:        p.name,
      description: p.description,
      priceQAR:    String(Number(p.priceQAR)),
      imageUrl:    p.imageUrl,
      stockLevel:  String(p.stockLevel),
      isAvailable: p.isAvailable,
      isFeatured:  p.isFeatured,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(BLANK)
  }

  function set(k: keyof typeof BLANK, v: any) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.description.trim() || !form.priceQAR) return
    setSaving(true)

    const isNew  = editId === '__new__'
    const url    = isNew ? '/api/admin/products' : `/api/admin/products/${editId}`
    const method = isNew ? 'POST' : 'PATCH'

    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        priceQAR:    parseFloat(form.priceQAR),
        imageUrl:    form.imageUrl || '/jar.png',
        stockLevel:  parseInt(form.stockLevel) || 0,
        isAvailable: form.isAvailable,
        isFeatured:  form.isFeatured,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast((data as any).error ?? 'Save failed', false)
        return
      }

      showToast(isNew ? 'Product created' : 'Product updated')
      cancelEdit()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      showToast('Product deleted')
      load()
    } finally {
      setDeleting(null)
    }
  }

  async function toggleField(id: string, field: 'isAvailable' | 'isFeatured', value: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [field]: value }),
    })
    load()
  }

  const inputClass  = 'w-full bg-stone-950 border border-stone-700 text-stone-200 placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors'
  const labelClass  = 'text-stone-400 text-xs font-medium block mb-1.5'

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

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Products</h1>
            <p className="text-stone-400 text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} in the shop</p>
          </div>
          {!editId && (
            <button
              onClick={() => setEditId('__new__')}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              + Add Product
            </button>
          )}
        </div>

        {/* ── Form (above the list so it's immediately visible) ── */}
        {editId && (
          <div className="mb-6 bg-stone-900 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">
                {editId === '__new__' ? 'New Product' : 'Edit Product'}
              </h2>
              <button type="button" onClick={cancelEdit}
                className="text-stone-500 hover:text-stone-300 text-sm transition-colors">
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Mango Achcharu" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Price (QAR) *</label>
                  <input type="number" step="0.01" min="0" value={form.priceQAR}
                    onChange={e => set('priceQAR', e.target.value)}
                    placeholder="25.00" required className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="A short, enticing description of this product…"
                  rows={2} required className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className={labelClass}>Stock Level</label>
                <input type="number" min="0" step="1" value={form.stockLevel}
                  onChange={e => set('stockLevel', e.target.value)}
                  placeholder="0" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Image / Emoji</label>
                <ImagePicker value={form.imageUrl} onChange={v => set('imageUrl', v)} />
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-stone-300 text-sm">Visible in shop</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-stone-300 text-sm">Featured (shown first)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2 border-t border-stone-800">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-sm transition-colors">
                  {saving ? 'Saving…' : editId === '__new__' ? 'Create Product' : 'Save Changes'}
                </button>
                <button type="button" onClick={cancelEdit}
                  className="px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm transition-colors">
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ── Product list ── */}
        {loading ? (
          <div className="text-stone-500 text-sm text-center py-16">Loading…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <img src="/jar.png" alt="" className="w-16 h-16 object-contain opacity-20 mx-auto mb-4" />
            <p className="text-stone-500 text-sm">No products yet. Add your first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map(p => (
              <div key={p.id} className={`bg-stone-900 border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                editId === p.id ? 'border-amber-500/40 opacity-60' : 'border-stone-800'
              }`}>

                {/* Image */}
                <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-stone-800 rounded-xl overflow-hidden">
                  <Icon src={p.imageUrl} textSize="text-3xl" imgClass="w-14 h-14" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{p.name}</span>
                    {p.isFeatured && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Featured</span>
                    )}
                    {!p.isAvailable && (
                      <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded-full">Hidden</span>
                    )}
                  </div>
                  <div className="text-stone-500 text-xs mt-0.5 truncate">{p.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-amber-400 font-bold text-sm">QAR {Number(p.priceQAR).toFixed(2)}</span>
                    <span className={`text-xs ${p.stockLevel > 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {p.stockLevel > 0 ? `${p.stockLevel} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button"
                    onClick={() => toggleField(p.id, 'isAvailable', !p.isAvailable)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      p.isAvailable
                        ? 'border-stone-700 text-stone-400 hover:border-red-700 hover:text-red-400'
                        : 'border-green-700/50 text-green-500 hover:bg-green-900/20'
                    }`}
                  >
                    {p.isAvailable ? 'Hide' : 'Show'}
                  </button>
                  <button type="button"
                    onClick={() => toggleField(p.id, 'isFeatured', !p.isFeatured)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      p.isFeatured
                        ? 'border-amber-500/50 text-amber-400 hover:border-stone-700 hover:text-stone-400'
                        : 'border-stone-700 text-stone-500 hover:border-amber-500/50 hover:text-amber-400'
                    }`}
                  >
                    {p.isFeatured ? '★' : '☆'}
                  </button>
                  <button type="button"
                    onClick={() => startEdit(p)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-800 text-stone-600 hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === p.id ? '…' : 'Del'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
