'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FruitRow    = { id: string; fruit: string; name: string; emoji: string; description: string | null; priceQAR: number; isActive: boolean; sortOrder: number }
type MixPrice    = { id: string; fruitsKey: string; label: string | null; priceQAR: number; isActive: boolean }
type SpiceOption = { id: string; key: string; label: string; emoji: string; description: string | null; multiplier: number; isActive: boolean; sortOrder: number }
type AddOn       = { id: string; type: string; name: string; description: string | null; priceQAR: number; isAvailable: boolean; sortOrder: number }

// ─── Icon: renders emoji text OR an uploaded image ───────────────────────────

function Icon({ src, textSize = 'text-xl', imgClass = 'w-8 h-8' }: { src: string; textSize?: string; imgClass?: string }) {
  if (!src) return <span className={textSize}>🍑</span>
  if (src.startsWith('/') || src.startsWith('http')) {
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-full`} />
  }
  return <span className={textSize}>{src}</span>
}

// ─── EmojiOrImagePicker ───────────────────────────────────────────────────────

function EmojiOrImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isUrl = value.startsWith('/') || value.startsWith('http')
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
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onChange(json.url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle */}
      <div className="flex gap-1.5">
        {(['emoji', 'image'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`capitalize text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              mode === m
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-300'
            }`}
          >
            {m === 'emoji' ? '😀 Emoji' : '🖼 Image'}
          </button>
        ))}
      </div>

      {mode === 'emoji' ? (
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="e.g. 🥭"
            value={isUrl ? '' : value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
          {!isUrl && value && <span className="text-3xl">{value}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden" onChange={handleFile}
            />
            <div className={`border border-dashed rounded-xl px-4 py-3 text-center text-xs transition-colors ${
              uploading
                ? 'border-amber-500/60 text-amber-400 bg-amber-500/5'
                : 'border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-400 hover:bg-stone-800/50'
            }`}>
              {uploading ? 'Uploading…' : 'Click to upload · JPG, PNG, WebP, GIF · max 2 MB'}
            </div>
          </label>
          {isUrl && (
            <div className="relative shrink-0">
              <img src={value} alt="" className="w-12 h-12 rounded-xl object-cover border border-stone-700" />
              <button type="button" onClick={() => onChange('🍑')}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-stone-700 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center leading-none transition-colors"
              >×</button>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

// ─── Shared: inline-editable price / number ───────────────────────────────────

function InlineNumber({
  value, step = '0.50', min = '0.01', suffix = '', prefix = '',
  onSave, saving,
}: {
  value: number; step?: string; min?: string; suffix?: string; prefix?: string
  onSave: (n: number) => Promise<void>; saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(Number(value).toFixed(step.includes('.') ? step.split('.')[1].length : 0))

  useEffect(() => { if (!editing) setDraft(Number(value).toFixed(step.includes('.') ? step.split('.')[1].length : 2)) }, [value, editing, step])

  async function commit() {
    const n = parseFloat(draft)
    if (!isNaN(n) && n > 0) { await onSave(n); setEditing(false) }
  }

  if (editing) return (
    <div className="flex items-center gap-1.5">
      {prefix && <span className="text-stone-500 text-xs">{prefix}</span>}
      <input autoFocus type="number" step={step} min={min} value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-20 bg-stone-800 border border-amber-500 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
      />
      {suffix && <span className="text-stone-500 text-xs">{suffix}</span>}
      <button onClick={commit} disabled={saving} className="text-amber-400 hover:text-amber-300 text-xs font-bold">{saving ? '…' : '✓'}</button>
      <button onClick={() => setEditing(false)} className="text-stone-600 hover:text-stone-400 text-xs">✕</button>
    </div>
  )

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 group" title="Click to edit">
      {prefix && <span className="text-stone-500 text-sm">{prefix}</span>}
      <span className="text-amber-400 font-bold text-sm">{Number(value).toFixed(step.includes('.') ? step.split('.')[1].length : 2)}</span>
      {suffix && <span className="text-stone-400 text-sm">{suffix}</span>}
      <span className="text-stone-700 group-hover:text-stone-400 text-xs ml-0.5">✎</span>
    </button>
  )
}

// ─── Fruit picker ─────────────────────────────────────────────────────────────

function FruitPicker({ allFruits, selected, onChange }: {
  allFruits: Pick<FruitRow, 'fruit' | 'name' | 'emoji'>[]
  selected: string[]
  onChange: (f: string[]) => void
}) {
  function toggle(fruit: string) {
    onChange(selected.includes(fruit) ? selected.filter(f => f !== fruit) : [...selected, fruit])
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {allFruits.map(f => {
        const on = selected.includes(f.fruit)
        return (
          <button key={f.fruit} type="button" onClick={() => toggle(f.fruit)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              on ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600 hover:text-stone-300'
            }`}
          >
            <Icon src={f.emoji} textSize="text-lg" imgClass="w-6 h-6" />
            <span className="truncate">{f.name}</span>
            {on && <span className="ml-auto text-amber-500">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Combination form ─────────────────────────────────────────────────────────

function CombinationForm({
  allFruits, initialFruits = [], initialLabel = '', initialPrice = '',
  submitLabel, onSubmit, onCancel, existingKeys,
}: {
  allFruits: Pick<FruitRow, 'fruit' | 'name' | 'emoji'>[]
  initialFruits?: string[]; initialLabel?: string; initialPrice?: string
  submitLabel: string; existingKeys: string[]
  onSubmit: (fruits: string[], price: number, label: string) => Promise<void>
  onCancel?: () => void
}) {
  const [fruits, setFruits] = useState<string[]>(initialFruits)
  const [label,  setLabel]  = useState(initialLabel)
  const [price,  setPrice]  = useState(initialPrice)
  const [error,  setError]  = useState('')
  const [busy,   setBusy]   = useState(false)

  async function handleSubmit() {
    setError('')
    if (fruits.length < 2) { setError('Select at least 2 fruits.'); return }
    const n = parseFloat(price)
    if (isNaN(n) || n <= 0) { setError('Enter a valid price.'); return }
    const key = [...fruits].sort().join(',')
    if (existingKeys.includes(key)) { setError('This combination already exists.'); return }
    setBusy(true)
    try { await onSubmit(fruits, n, label) }
    catch { setError('Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <FruitPicker allFruits={allFruits} selected={fruits} onChange={setFruits} />
      {fruits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fruits.map(fk => {
            const meta = allFruits.find(f => f.fruit === fk)
            return (
              <span key={fk} className="bg-stone-800 text-stone-300 text-xs px-2.5 py-1 rounded-full border border-stone-700">
                {meta?.emoji} {meta?.name ?? fk}
              </span>
            )
          })}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Label <span className="text-stone-700">(optional)</span></label>
          <input type="text" placeholder="e.g. Tropical Mix" value={label} onChange={e => setLabel(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Price (QAR)</label>
          <input type="number" step="0.50" min="1" placeholder="e.g. 35.00" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>
      </div>
      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={busy || fruits.length < 2 || !price}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            fruits.length >= 2 && price && !busy
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 text-sm transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Spice form (create / edit) ───────────────────────────────────────────────

function SpiceForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial?: Partial<SpiceOption>
  submitLabel: string
  onSubmit: (data: { label: string; emoji: string; description: string; multiplier: number }) => Promise<void>
  onCancel?: () => void
}) {
  const [label,       setLabel]       = useState(initial?.label ?? '')
  const [emoji,       setEmoji]       = useState(initial?.emoji ?? '🌶️')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [multiplier,  setMultiplier]  = useState(initial?.multiplier != null ? Number(initial.multiplier).toFixed(3) : '1.000')
  const [error,       setError]       = useState('')
  const [busy,        setBusy]        = useState(false)

  async function handleSubmit() {
    setError('')
    if (!label.trim()) { setError('Label is required.'); return }
    const m = parseFloat(multiplier)
    if (isNaN(m) || m <= 0) { setError('Multiplier must be > 0.'); return }
    setBusy(true)
    try { await onSubmit({ label: label.trim(), emoji, description, multiplier: m }) }
    catch (e: any) { setError(e.message ?? 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const previewKey = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || '—'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-stone-500 text-xs block mb-1.5">Label <span className="text-red-500">*</span></label>
        <input type="text" placeholder="e.g. Ghost Pepper" value={label} onChange={e => setLabel(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
        />
        {!initial && label && (
          <p className="text-stone-600 text-xs mt-1">Key: <span className="font-mono text-stone-500">{previewKey}</span></p>
        )}
      </div>

      <div>
        <label className="text-stone-500 text-xs block mb-1.5">Icon</label>
        <EmojiOrImagePicker value={emoji} onChange={setEmoji} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Description <span className="text-stone-700">(optional)</span></label>
          <input type="text" placeholder="e.g. Extreme heat (+40%)" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">
            Price multiplier <span className="text-stone-600 font-normal">(e.g. 1.200 = +20%)</span>
          </label>
          <input type="number" step="0.050" min="0.5" max="5" placeholder="1.000" value={multiplier} onChange={e => setMultiplier(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors font-mono"
          />
        </div>
      </div>

      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={busy || !label.trim() || !multiplier}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            label.trim() && multiplier && !busy
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 text-sm transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add-on form (create / edit) ──────────────────────────────────────────────

function AddOnForm({
  initial, submitLabel, onSubmit, onCancel, showEmoji = false,
}: {
  initial?: Partial<AddOn & { extraField?: string }>
  submitLabel: string
  showEmoji?: boolean
  onSubmit: (data: { name: string; description: string; priceQAR: number; emoji?: string }) => Promise<void>
  onCancel?: () => void
}) {
  const [name,        setName]        = useState(initial?.name ?? '')
  const [emoji,       setEmoji]       = useState(initial?.extraField ?? '🍑')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price,       setPrice]       = useState(initial?.priceQAR != null ? Number(initial.priceQAR).toFixed(2) : '')
  const [error,       setError]       = useState('')
  const [busy,        setBusy]        = useState(false)

  async function handleSubmit() {
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    const n = parseFloat(price)
    if (isNaN(n) || n <= 0) { setError('Enter a valid price.'); return }
    setBusy(true)
    try { await onSubmit({ name: name.trim(), description, priceQAR: n, ...(showEmoji && { emoji }) }) }
    catch (e: any) { setError(e.message ?? 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const previewKey = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || '—'

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Name <span className="text-red-500">*</span></label>
          <input type="text" placeholder="e.g. Jambu Rose" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
          {!initial && name && (
            <p className="text-stone-600 text-xs mt-1">Key: <span className="font-mono text-stone-500">{previewKey}</span></p>
          )}
        </div>
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Price (QAR) <span className="text-red-500">*</span></label>
          <input type="number" step="0.50" min="0.50" placeholder="e.g. 25.00" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>
      </div>
      {showEmoji && (
        <div>
          <label className="text-stone-500 text-xs block mb-1.5">Icon</label>
          <EmojiOrImagePicker value={emoji} onChange={setEmoji} />
        </div>
      )}
      <div>
        <label className="text-stone-500 text-xs block mb-1.5">Description <span className="text-stone-700">(optional)</span></label>
        <input type="text" placeholder="e.g. Tangy pickled lime wedges" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 text-white placeholder-stone-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
        />
      </div>
      {error && <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={busy || !name.trim() || !price}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            name.trim() && price && !busy
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 text-sm transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Hidden' }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
      active
        ? 'bg-green-900/30 text-green-400 border-green-900/50'
        : 'bg-stone-800 text-stone-600 border-stone-700'
    }`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPricingPage() {
  const [allFruits,     setAllFruits]     = useState<FruitRow[]>([])
  const [mixPrices,     setMixPrices]     = useState<MixPrice[]>([])
  const [spiceOptions,  setSpiceOptions]  = useState<SpiceOption[]>([])
  const [addOns,        setAddOns]        = useState<AddOn[]>([])

  const [editingFruit,  setEditingFruit]  = useState<string | null>(null)
  const [showNewFruit,  setShowNewFruit]  = useState(false)

  const [savingKey,    setSavingKey]    = useState<string | null>(null)
  const [editingKey,   setEditingKey]   = useState<string | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)

  const [editingSpice, setEditingSpice] = useState<string | null>(null)
  const [showNewSpice, setShowNewSpice] = useState(false)

  const [editingAddOn, setEditingAddOn] = useState<string | null>(null)
  const [showNewAddOn, setShowNewAddOn] = useState(false)

  async function load() {
    const [fr, mx, sp, ao] = await Promise.all([
      fetch('/api/admin/fruits').then(r => r.json()),
      fetch('/api/admin/mix-prices').then(r => r.json()),
      fetch('/api/admin/spice-options').then(r => r.json()),
      fetch('/api/admin/add-ons').then(r => r.json()),
    ])
    setAllFruits(fr)
    setMixPrices(mx)
    setSpiceOptions(sp)
    setAddOns(ao)
  }

  useEffect(() => { load() }, [])

  // ── Fruits ──────────────────────────────────────────────────────────────────
  async function createFruit(data: { name: string; description: string; priceQAR: number; emoji?: string }) {
    const res = await fetch('/api/admin/fruits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
    setShowNewFruit(false)
    await load()
  }

  async function updateFruit(id: string, data: Partial<{ name: string; emoji: string; description: string; priceQAR: number }>) {
    await fetch('/api/admin/fruits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    setEditingFruit(null)
    await load()
  }

  async function toggleFruit(id: string, isActive: boolean) {
    await fetch('/api/admin/fruits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    await load()
  }

  // ── Mix prices ──────────────────────────────────────────────────────────────
  async function createCombination(fruits: string[], priceQAR: number, label: string) {
    await fetch('/api/admin/mix-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fruits, priceQAR, label: label || undefined }),
    })
    setShowCreate(false)
    await load()
  }

  async function updateCombination(originalKey: string, fruits: string[], priceQAR: number, label: string) {
    const newKey = [...fruits].sort().join(',')
    if (newKey !== originalKey) {
      await fetch('/api/admin/mix-prices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fruitsKey: originalKey }),
      })
    }
    await fetch('/api/admin/mix-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fruits, priceQAR, label: label || undefined }),
    })
    setEditingKey(null)
    await load()
  }

  async function deleteMix(fruitsKey: string) {
    if (!confirm("Remove this combination? Customers won't be able to order it.")) return
    await fetch('/api/admin/mix-prices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fruitsKey }),
    })
    await load()
  }

  function existingKeysExcluding(excludeKey?: string) {
    return mixPrices.map(mp => mp.fruitsKey).filter(k => k !== excludeKey)
  }

  // ── Spice options ───────────────────────────────────────────────────────────
  async function createSpice(data: { label: string; emoji: string; description: string; multiplier: number }) {
    const res = await fetch('/api/admin/spice-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }
    setShowNewSpice(false)
    await load()
  }

  async function updateSpice(id: string, data: { label: string; emoji: string; description: string; multiplier: number }) {
    await fetch('/api/admin/spice-options', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    setEditingSpice(null)
    await load()
  }

  async function toggleSpice(id: string, isActive: boolean) {
    await fetch('/api/admin/spice-options', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    await load()
  }

  async function deleteSpice(id: string, label: string) {
    if (!confirm(`Remove "${label}"? This will be unavailable in the customizer.`)) return
    await fetch('/api/admin/spice-options', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  // ── Add-ons ──────────────────────────────────────────────────────────────────
  async function createAddOn(data: { name: string; description: string; priceQAR: number }) {
    const res = await fetch('/api/admin/add-ons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error)
    }
    setShowNewAddOn(false)
    await load()
  }

  async function updateAddOn(id: string, data: { name: string; description: string; priceQAR: number }) {
    await fetch('/api/admin/add-ons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    setEditingAddOn(null)
    await load()
  }

  async function toggleAddOn(id: string, isAvailable: boolean) {
    await fetch('/api/admin/add-ons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isAvailable }),
    })
    await load()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-950 p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-white font-bold">Customizer Settings</h1>
            <p className="text-stone-400 text-sm mt-1">
              Manage fruit prices, combinations, spice levels, and premium extras.
              Only what you define here is available to customers.
            </p>
          </div>
          <a
            href="/admin/orders"
            className="shrink-0 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            📦 Orders
          </a>
        </div>

        {/* ══════════════════════════════════════
            1. Fruits
        ══════════════════════════════════════ */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-white font-semibold">Fruits</h2>
            {!showNewFruit && editingFruit === null && (
              <button onClick={() => setShowNewFruit(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                + New Fruit
              </button>
            )}
          </div>
          <p className="text-stone-500 text-xs mb-5">
            Fruits available in the customizer. Hidden fruits won't appear on the shelf.
          </p>

          {showNewFruit && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 mb-5">
              <h3 className="text-white text-sm font-semibold mb-4">New Fruit</h3>
              <AddOnForm
                showEmoji
                submitLabel="+ Add Fruit"
                onSubmit={data => createFruit(data)}
                onCancel={() => setShowNewFruit(false)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {allFruits.map(f => {
              if (editingFruit === f.id) {
                return (
                  <div key={f.id} className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
                    <h3 className="text-white text-sm font-semibold mb-1">Edit — {f.name}</h3>
                    <p className="text-stone-600 text-xs mb-4 font-mono">Key: {f.fruit}</p>
                    <AddOnForm
                      showEmoji
                      initial={{ name: f.name, description: f.description ?? '', priceQAR: f.priceQAR, extraField: f.emoji }}
                      submitLabel="Save Changes"
                      onSubmit={data => updateFruit(f.id, { name: data.name, description: data.description, priceQAR: data.priceQAR, emoji: data.emoji })}
                      onCancel={() => setEditingFruit(null)}
                    />
                  </div>
                )
              }
              return (
                <div key={f.id} className="flex items-center gap-3 bg-stone-800/50 rounded-xl px-4 py-3">
                  <Icon src={f.emoji} imgClass="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{f.name}</div>
                    {f.description && <div className="text-stone-500 text-xs mt-0.5 truncate">{f.description}</div>}
                  </div>
                  <InlineNumber value={f.priceQAR} prefix="QAR" onSave={p => updateFruit(f.id, { priceQAR: p })} saving={savingKey === f.id} />
                  <StatusBadge active={f.isActive} activeLabel="Active" inactiveLabel="Hidden" />
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleFruit(f.id, !f.isActive)}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >{f.isActive ? 'Hide' : 'Show'}</button>
                    <button onClick={() => { setEditingFruit(f.id); setShowNewFruit(false) }}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >Edit</button>
                  </div>
                </div>
              )
            })}
            {allFruits.length === 0 && !showNewFruit && (
              <div className="text-center py-8 border border-dashed border-stone-800 rounded-xl">
                <p className="text-stone-600 text-sm">No fruits yet.</p>
                <button onClick={() => setShowNewFruit(true)} className="mt-2 text-amber-500 hover:text-amber-400 text-sm transition-colors">
                  Add a fruit →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════
            2. Combination Jars
        ══════════════════════════════════════ */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-white font-semibold">Combination Jars</h2>
            {!showCreate && editingKey === null && (
              <button onClick={() => setShowCreate(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                + New Combination
              </button>
            )}
          </div>
          <p className="text-stone-500 text-xs mb-5">Combinations not listed here show as unavailable to customers.</p>

          {showCreate && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 mb-5">
              <h3 className="text-white text-sm font-semibold mb-4">New Combination</h3>
              <CombinationForm
                allFruits={allFruits}
                submitLabel="+ Add Combination"
                onSubmit={createCombination}
                onCancel={() => setShowCreate(false)}
                existingKeys={existingKeysExcluding()}
              />
            </div>
          )}

          {mixPrices.length === 0 && !showCreate ? (
            <div className="text-center py-10 border border-dashed border-stone-800 rounded-xl">
              <img src="/jar.png" alt="" className="w-10 h-10 object-contain opacity-20 mx-auto mb-2" />
              <p className="text-stone-600 text-sm">No combinations yet.</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-amber-500 hover:text-amber-400 text-sm transition-colors">
                Create your first combination →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {mixPrices.map(mp => {
                if (editingKey === mp.fruitsKey) {
                  return (
                    <div key={mp.id} className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
                      <h3 className="text-white text-sm font-semibold mb-4">Edit Combination</h3>
                      <CombinationForm
                        allFruits={allFruits}
                        initialFruits={mp.fruitsKey.split(',')}
                        initialLabel={mp.label ?? ''}
                        initialPrice={Number(mp.priceQAR).toFixed(2)}
                        submitLabel="Save Changes"
                        onSubmit={(fruits, price, label) => updateCombination(mp.fruitsKey, fruits, price, label)}
                        onCancel={() => setEditingKey(null)}
                        existingKeys={existingKeysExcluding(mp.fruitsKey)}
                      />
                    </div>
                  )
                }
                return (
                  <div key={mp.id} className="flex items-center gap-3 bg-stone-800/50 rounded-xl px-4 py-3">
                    <div className="flex gap-0.5 shrink-0">
                      {mp.fruitsKey.split(',').map(fk => {
                        const meta = allFruits.find(f => f.fruit === fk)
                        return <Icon key={fk} src={meta?.emoji ?? '🍑'} imgClass="w-6 h-6" />
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {mp.label ?? mp.fruitsKey.split(',').map(fk => allFruits.find(f => f.fruit === fk)?.name ?? fk).join(' + ')}
                      </div>
                      <div className="text-stone-600 text-xs">{mp.fruitsKey.split(',').length} fruits</div>
                    </div>
                    <span className="text-amber-400 font-bold text-sm shrink-0">QAR {Number(mp.priceQAR).toFixed(2)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingKey(mp.fruitsKey); setShowCreate(false) }}
                        className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                      >Edit</button>
                      <button onClick={() => deleteMix(mp.fruitsKey)}
                        className="text-stone-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                      >Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════
            3. Spice Levels
        ══════════════════════════════════════ */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-white font-semibold">Spice Levels</h2>
            {!showNewSpice && editingSpice === null && (
              <button onClick={() => setShowNewSpice(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                + New Level
              </button>
            )}
          </div>
          <p className="text-stone-500 text-xs mb-5">
            Multiplier affects the jar price. ×1.000 = no change. ×1.200 = +20% on the base price.
          </p>

          {showNewSpice && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 mb-5">
              <h3 className="text-white text-sm font-semibold mb-4">New Spice Level</h3>
              <SpiceForm submitLabel="+ Add Level" onSubmit={createSpice} onCancel={() => setShowNewSpice(false)} />
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {spiceOptions.map(so => {
              if (editingSpice === so.id) {
                return (
                  <div key={so.id} className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
                    <h3 className="text-white text-sm font-semibold mb-4">Edit — {so.label}</h3>
                    <SpiceForm
                      initial={so}
                      submitLabel="Save Changes"
                      onSubmit={data => updateSpice(so.id, data)}
                      onCancel={() => setEditingSpice(null)}
                    />
                  </div>
                )
              }
              return (
                <div key={so.id} className="flex items-center gap-3 bg-stone-800/50 rounded-xl px-4 py-3">
                  <Icon src={so.emoji} imgClass="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{so.label}</div>
                    {so.description && <div className="text-stone-500 text-xs mt-0.5 truncate">{so.description}</div>}
                  </div>
                  <span className="text-stone-400 text-sm font-mono shrink-0">×{Number(so.multiplier).toFixed(3)}</span>
                  <StatusBadge active={so.isActive} />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleSpice(so.id, !so.isActive)}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >
                      {so.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => { setEditingSpice(so.id); setShowNewSpice(false) }}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSpice(so.id, so.label)}
                      className="text-stone-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
            {spiceOptions.length === 0 && !showNewSpice && (
              <div className="text-center py-8 border border-dashed border-stone-800 rounded-xl">
                <p className="text-stone-600 text-sm">No spice levels yet.</p>
                <button onClick={() => setShowNewSpice(true)} className="mt-2 text-amber-500 hover:text-amber-400 text-sm transition-colors">
                  Add a spice level →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════
            4. Extras / Add-Ons
        ══════════════════════════════════════ */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-white font-semibold">Premium Extras</h2>
            {!showNewAddOn && editingAddOn === null && (
              <button onClick={() => setShowNewAddOn(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                + New Extra
              </button>
            )}
          </div>
          <p className="text-stone-500 text-xs mb-5">
            Add-on items customers can include with any custom jar.
            Hidden extras won't appear in the customizer.
          </p>

          {showNewAddOn && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 mb-5">
              <h3 className="text-white text-sm font-semibold mb-4">New Extra</h3>
              <AddOnForm submitLabel="+ Add Extra" onSubmit={createAddOn} onCancel={() => setShowNewAddOn(false)} />
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {addOns.map(ao => {
              if (editingAddOn === ao.id) {
                return (
                  <div key={ao.id} className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
                    <h3 className="text-white text-sm font-semibold mb-4">Edit — {ao.name}</h3>
                    <AddOnForm
                      initial={ao}
                      submitLabel="Save Changes"
                      onSubmit={data => updateAddOn(ao.id, data)}
                      onCancel={() => setEditingAddOn(null)}
                    />
                  </div>
                )
              }
              return (
                <div key={ao.id} className="flex items-center gap-3 bg-stone-800/50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{ao.name}</div>
                    {ao.description && <div className="text-stone-500 text-xs mt-0.5 truncate">{ao.description}</div>}
                  </div>
                  <span className="text-amber-400 font-bold text-sm shrink-0">QAR {Number(ao.priceQAR).toFixed(2)}</span>
                  <StatusBadge active={ao.isAvailable} activeLabel="Available" inactiveLabel="Hidden" />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAddOn(ao.id, !ao.isAvailable)}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >
                      {ao.isAvailable ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => { setEditingAddOn(ao.id); setShowNewAddOn(false) }}
                      className="text-stone-500 hover:text-amber-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-700"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
            {addOns.length === 0 && !showNewAddOn && (
              <div className="text-center py-8 border border-dashed border-stone-800 rounded-xl">
                <p className="text-stone-600 text-sm">No extras yet.</p>
                <button onClick={() => setShowNewAddOn(true)} className="mt-2 text-amber-500 hover:text-amber-400 text-sm transition-colors">
                  Add an extra →
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
