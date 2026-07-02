'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Jar liquid fill colours by fruit key (display-only, not stored in DB)
const FRUIT_COLORS: Record<string, string> = {
  MANGO:     '#f59e0b',
  AMBARELLA: '#84cc16',
  PINEAPPLE: '#eab308',
  VERALU:    '#8b5cf6',
  RED_ONION: '#ef4444',
  DATES:     '#92400e',
}

const MODIFIERS = [
  { key: 'extraSweet',   label: 'Extra Sweet',   emoji: '🍯' },
  { key: 'extraSour',    label: 'Extra Sour',    emoji: '🍋' },
  { key: 'extraMustard', label: 'Extra Mustard', emoji: '🌻' },
  { key: 'extraGarlic',  label: 'Extra Garlic',  emoji: '🧄' },
]

type FruitRow    = { fruit: string; name: string; emoji: string; description: string | null; priceQAR: number }

// Renders either emoji text or an uploaded image URL
function FruitIcon({ src, textClass = 'text-4xl', imgClass = 'w-10 h-10' }: { src: string; textClass?: string; imgClass?: string }) {
  if (src.startsWith('/') || src.startsWith('http')) {
    return <img src={src} alt="" className={`${imgClass} object-cover rounded-full`} />
  }
  return <span className={textClass}>{src}</span>
}
type AddOn       = { id: string; type: string; name: string; description: string | null; priceQAR: string | number }
type SelectedAddOn = { addOnId: string; quantity: number }
type MixPrice    = { fruitsKey: string; label: string | null; priceQAR: number }
type SpiceOption = { key: string; label: string; emoji: string; description: string | null; multiplier: number }

// ─── Main component ───────────────────────────────────────────────────────────

export default function CustomizePage() {
  const router      = useRouter()
  const [step, setStep]             = useState(1)
  const [fruits, setFruits]           = useState<FruitRow[]>([])
  const [addOns, setAddOns]           = useState<AddOn[]>([])
  const [mixPrices, setMixPrices]     = useState<MixPrice[]>([])
  const [spiceOptions, setSpiceOptions] = useState<SpiceOption[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [jarShake, setJarShake]     = useState(false)

  const [selectedFruits, setSelectedFruits] = useState<string[]>([])
  const [spice, setSpice]                   = useState('')
  const [mods, setMods]                     = useState({ extraSweet: false, extraSour: false, extraMustard: false, extraGarlic: false })
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([])
  const [notes, setNotes]                   = useState('')

  useEffect(() => {
    fetch('/api/customize').then(r => r.json()).then(d => {
      setFruits(d.fruits ?? [])
      setAddOns(d.addOns ?? [])
      setMixPrices(d.mixPrices ?? [])
      setSpiceOptions(d.spiceOptions ?? [])
    })
  }, [])

  // Derive fruitPrices map from the fruits catalogue
  const fruitPrices = Object.fromEntries(fruits.map(f => [f.fruit, f.priceQAR]))

  // Live price — must be admin-defined; no fallback averaging
  const fruitsKey = [...selectedFruits].sort().join(',')

  const singleFruitPrice = selectedFruits.length === 1
    ? (fruitPrices[selectedFruits[0]] ?? null)
    : null

  const exactMixPrice = selectedFruits.length >= 2
    ? mixPrices.find(mp => mp.fruitsKey === fruitsKey) ?? null
    : null

  // true only when admin has set a price for this exact selection
  const hasPricing =
    selectedFruits.length === 0 ? false
    : selectedFruits.length === 1 ? singleFruitPrice != null
    : exactMixPrice != null

  const basePrice =
    selectedFruits.length === 0 ? 0
    : selectedFruits.length === 1 ? (singleFruitPrice ?? 0)
    : (exactMixPrice?.priceQAR ?? 0)

  const avgBase = basePrice
  const selectedSpice = spiceOptions.find(s => s.key === spice)
  const multiplier = selectedSpice?.multiplier ?? 1.0
  const addOnTotal = selectedAddOns.reduce((s, sel) => {
    const ao = addOns.find(a => a.id === sel.addOnId)
    return s + (ao ? Number(ao.priceQAR) * sel.quantity : 0)
  }, 0)
  const totalPrice = avgBase * multiplier + addOnTotal

  // Jar fill colour — use the static colour map (display-only)
  const jarColor = selectedFruits.length > 0
    ? (FRUIT_COLORS[selectedFruits[0]] ?? '#f59e0b')
    : 'transparent'

  // ── Fruit selection ──────────────────────────────────────────────────────────
  function addFruit(value: string) {
    if (selectedFruits.includes(value)) {
      triggerShake(); return
    }
    setSelectedFruits(prev => [...prev, value])
  }

  function removeFruit(value: string) {
    setSelectedFruits(prev => prev.filter(f => f !== value))
  }

  function triggerShake() {
    setJarShake(true)
    setTimeout(() => setJarShake(false), 500)
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, value: string) {
    e.dataTransfer.setData('text/plain', value)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      setIsDragOver(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const v = e.dataTransfer.getData('text/plain')
    if (v) addFruit(v)
  }

  // ── Add-ons helpers ──────────────────────────────────────────────────────────
  function toggleMod(key: string) {
    setMods(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns(prev => prev.find(a => a.addOnId === id)
      ? prev.filter(a => a.addOnId !== id)
      : [...prev, { addOnId: id, quantity: 1 }])
  }

  function changeQty(id: string, delta: number) {
    setSelectedAddOns(prev => prev.map(a =>
      a.addOnId !== id ? a : { ...a, quantity: Math.max(1, a.quantity + delta) }
    ))
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleProceed() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseFruits: selectedFruits,
          spiceLevel: spice,
          ...mods,
          customNotes: notes || null,
          addOns: selectedAddOns,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      router.push(`/checkout?customId=${data.customBuild.id}`)
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-950">

      {/* Hero */}
      <section className="bg-stone-900 border-b border-stone-800 py-10 text-center">
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Make It Yours</span>
        <h1 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">Build Your Custom Achcharu</h1>
        <p className="text-stone-400 mt-3 max-w-md mx-auto text-sm">
          Mix and match fruits by dragging them into the jar. Set the spice and extras to make it truly yours.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">

        <StepIndicator current={step} />

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Drag-and-drop jar builder
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="pb-24">
            <div className="mb-8">
              <h2 className="font-display text-2xl text-white font-bold">Build Your Fruit Mix</h2>
              <p className="text-stone-400 text-sm mt-1">
                Achcharu can be made from a single fruit or a blend. Drag fruits into the jar, or tap them.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-start">

              {/* ── Fruit shelf ── */}
              <div>
                <p className="text-stone-300 text-xs font-semibold uppercase tracking-widest mb-4">
                  Fruit Shelf — drag or tap to add
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fruits.map(f => {
                    const inJar = selectedFruits.includes(f.fruit)
                    return (
                      <div
                        key={f.fruit}
                        draggable={!inJar}
                        onDragStart={e => onDragStart(e, f.fruit)}
                        onClick={() => inJar ? removeFruit(f.fruit) : addFruit(f.fruit)}
                        className={`relative rounded-xl border p-4 text-center select-none transition-all ${
                          inJar
                            ? 'border-amber-500/50 bg-amber-500/10 cursor-pointer'
                            : 'border-stone-800 bg-stone-900 hover:border-amber-500/40 hover:bg-stone-800 cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {inJar && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-stone-950/50 z-10">
                            <span className="text-amber-400 text-xs font-bold bg-stone-950/80 px-2 py-0.5 rounded-full">
                              ✓ In jar
                            </span>
                          </div>
                        )}
                        <div className="mb-2 flex justify-center pointer-events-none">
                          <FruitIcon src={f.emoji} textClass="text-4xl" imgClass="w-12 h-12" />
                        </div>
                        <div className="text-white font-semibold text-sm leading-tight pointer-events-none">{f.name}</div>
                        {f.description && <div className="text-stone-500 text-xs mt-0.5 pointer-events-none">{f.description}</div>}
                        <div className="text-amber-400 font-bold text-sm mt-2 pointer-events-none">
                          QAR {f.priceQAR.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-stone-400 text-xs mt-4 text-center lg:text-left">
                  💡 Tap a fruit in the jar tags below to remove it
                </p>
              </div>

              {/* ── Jar ── */}
              <div className="flex flex-col items-center lg:sticky lg:top-8">
                <p className="text-stone-300 text-xs font-semibold uppercase tracking-widest mb-4">Your Jar</p>

                {/* Jar shape */}
                <div className="flex flex-col items-center">

                  {/* Lid */}
                  <div className="w-40 h-5 bg-amber-500 rounded-t-md shadow-lg z-10 relative">
                    <div className="absolute inset-x-2 bottom-0 h-1 bg-amber-600 rounded-b" />
                  </div>

                  {/* Neck */}
                  <div className="w-28 h-8 border-x-2 border-amber-500/50 bg-stone-950" />

                  {/* Body — drop zone */}
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative w-56 h-72 border-2 rounded-b-[44px] overflow-hidden transition-all duration-200 ${
                      isDragOver
                        ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.25)]'
                        : jarShake
                        ? 'border-red-500/60'
                        : 'border-amber-500/40'
                    } ${jarShake ? 'animate-bounce' : ''}`}
                  >
                    {/* Glass sheen */}
                    <div className="absolute top-3 left-5 w-2 h-24 bg-white/[0.04] rounded-full pointer-events-none" />
                    <div className="absolute top-3 left-9 w-1 h-14 bg-white/[0.03] rounded-full pointer-events-none" />

                    {/* Liquid fill */}
                    <div
                      className="absolute bottom-0 inset-x-0 transition-all duration-700 ease-in-out pointer-events-none"
                      style={{
                        height: selectedFruits.length === 0 ? '0%' : `${Math.min(45 + selectedFruits.length * 12, 88)}%`,
                        background: jarColor,
                        opacity: 0.18,
                      }}
                    />

                    {/* Fruit emojis inside jar */}
                    {selectedFruits.length > 0 && (
                      <div className="absolute inset-x-0 bottom-5 flex flex-wrap justify-center gap-1 px-4 pointer-events-none">
                        {selectedFruits.map((v, i) => {
                          const fr = fruits.find(x => x.fruit === v)
                          const offsets = ['mb-0', 'mb-3', 'mb-1', 'mb-4', 'mb-2', 'mb-1']
                          return (
                            <span key={v} title={fr?.name} className={`drop-shadow-lg ${offsets[i % offsets.length]}`}>
                              <FruitIcon src={fr?.emoji ?? ''} textClass="text-3xl" imgClass="w-8 h-8" />
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Empty / drag-over state */}
                    {selectedFruits.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <img src="/jar.png" alt="" className="w-12 h-12 object-contain opacity-20" />
                        <p className="text-stone-400 text-xs text-center px-6 leading-relaxed">
                          {isDragOver ? '✨ Drop it!' : 'Drag fruits here\nor tap them on the shelf'}
                        </p>
                      </div>
                    )}

                    {isDragOver && selectedFruits.length > 0 && (
                      <div className="absolute inset-0 bg-amber-400/5 flex items-start justify-center pt-4 pointer-events-none">
                        <span className="text-amber-400 text-sm font-bold bg-stone-950/80 px-3 py-1 rounded-full">
                          Drop it! 🎯
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fruit tags below jar */}
                  {selectedFruits.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-56">
                      {selectedFruits.map(v => {
                        const fr = fruits.find(x => x.fruit === v)
                        return (
                          <button key={v} onClick={() => removeFruit(v)}
                            className="flex items-center gap-1 bg-stone-800 hover:bg-red-900/40 border border-stone-700 hover:border-red-500/40 text-stone-300 hover:text-red-400 text-xs px-2.5 py-1 rounded-full transition-all"
                          >
                            <FruitIcon src={fr?.emoji ?? ''} textClass="text-sm" imgClass="w-4 h-4" />
                            {fr?.name}
                            <span className="opacity-50 ml-0.5">×</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Price display */}
                  <div className="mt-5 text-center min-h-16">
                    {selectedFruits.length === 0 ? (
                      <div className="text-stone-700 text-xs">Add at least one fruit</div>
                    ) : hasPricing ? (
                      <>
                        <div className="text-stone-500 text-xs">Jar price</div>
                        <div className="text-amber-400 font-bold text-2xl">QAR {avgBase.toFixed(2)}</div>
                        {exactMixPrice?.label && (
                          <div className="text-amber-600 text-xs mt-1">✨ {exactMixPrice.label}</div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="text-2xl opacity-40">🚫</div>
                        <div className="text-stone-400 text-xs font-medium">Not currently available</div>
                        <div className="text-stone-400 text-xs text-center leading-relaxed max-w-44">
                          We don&apos;t offer this combination yet. Try removing a fruit or choosing a different mix.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Next */}
            <div className="flex justify-end mt-10">
              <button
                onClick={() => setStep(2)}
                disabled={!hasPricing}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-colors ${
                  hasPricing
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                Next: Choose Spice →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Spice level
        ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="pb-24">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-white font-bold">Choose Your Spice Level</h2>
              <p className="text-stone-400 text-sm mt-1">How bold do you want it?</p>
            </div>

            <div className="flex flex-col gap-3">
              {spiceOptions.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSpice(s.key)}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    spice === s.key
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-stone-800 bg-stone-900 hover:border-stone-600'
                  }`}
                >
                  <FruitIcon src={s.emoji} textClass="text-2xl" imgClass="w-8 h-8" />
                  <div className="flex-1">
                    <div className="text-white font-semibold">{s.label}</div>
                    {s.description && <div className="text-stone-400 text-xs mt-0.5">{s.description}</div>}
                  </div>
                  <div className="text-amber-400 font-bold text-sm whitespace-nowrap">
                    QAR {(avgBase * s.multiplier).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors text-sm font-medium">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!spice}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-colors ${
                  spice ? 'bg-amber-500 hover:bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                Next: Taste & Add-ons →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Taste modifiers + Add-ons
        ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="pb-24">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-white font-bold">Taste Modifiers & Add-ons</h2>
              <p className="text-stone-400 text-sm mt-1">Fine-tune the flavour profile and add premium extras.</p>
            </div>

            {/* Modifiers */}
            <div>
              <h3 className="text-stone-400 text-xs uppercase tracking-widest mb-3">
                Taste Modifiers <span className="text-stone-500 normal-case font-normal">— no extra charge</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {MODIFIERS.map(m => {
                  const active = mods[m.key as keyof typeof mods]
                  return (
                    <button
                      key={m.key}
                      onClick={() => toggleMod(m.key)}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        active
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-900 hover:border-stone-600'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className={`font-medium text-sm flex-1 text-left ${active ? 'text-amber-300' : 'text-stone-300'}`}>
                        {m.label}
                      </span>
                      {active && <span className="text-amber-500 text-sm font-bold">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Add-ons */}
            <div className="mt-8">
              <h3 className="text-stone-400 text-xs uppercase tracking-widest mb-3">Premium Add-ons</h3>
              <div className="flex flex-col gap-3">
                {addOns.map(ao => {
                  const sel = selectedAddOns.find(s => s.addOnId === ao.id)
                  return (
                    <div
                      key={ao.id}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                        sel ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 bg-stone-900'
                      }`}
                    >
                      <button onClick={() => toggleAddOn(ao.id)} className="flex-1 text-left">
                        <div className="text-white font-semibold text-sm">{ao.name}</div>
                        {ao.description && <div className="text-stone-400 text-xs mt-0.5">{ao.description}</div>}
                        <div className="text-amber-400 font-bold text-sm mt-1">
                          +QAR {Number(ao.priceQAR).toFixed(2)} each
                        </div>
                      </button>

                      {sel ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => changeQty(ao.id, -1)} className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 text-sm font-bold">−</button>
                          <span className="text-white font-bold w-4 text-center text-sm">{sel.quantity}</span>
                          <button onClick={() => changeQty(ao.id, +1)} className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center hover:bg-amber-400 text-sm font-bold">+</button>
                        </div>
                      ) : (
                        <button onClick={() => toggleAddOn(ao.id)} className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
                          Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors text-sm font-medium">
                ← Back
              </button>
              <button onClick={() => setStep(4)} className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors">
                Review My Jar →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 4 — Review & checkout
        ══════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="pb-24">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-white font-bold">Your Custom Jar</h2>
              <p className="text-stone-400 text-sm mt-1">Review before placing your order.</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-4">

              {/* Fruit mix */}
              <div className="flex items-start justify-between gap-4">
                <span className="text-stone-500 text-sm min-w-24">Fruit Mix</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {selectedFruits.map(v => {
                    const fr = fruits.find(x => x.fruit === v)
                    return (
                      <span key={v} className="inline-flex items-center gap-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs px-2.5 py-1 rounded-full">
                        <FruitIcon src={fr?.emoji ?? ''} textClass="text-sm" imgClass="w-4 h-4" /> {fr?.name}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-500 text-sm">Spice Level</span>
                <span className="text-stone-200 text-sm font-medium inline-flex items-center gap-1.5">
                  {selectedSpice && <FruitIcon src={selectedSpice.emoji} textClass="text-sm" imgClass="w-5 h-5" />}
                  {selectedSpice?.label}
                </span>
              </div>

              {Object.entries(mods).some(([, v]) => v) && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-stone-500 text-sm">Taste Modifiers</span>
                  <span className="text-stone-200 text-sm font-medium text-right">
                    {MODIFIERS.filter(m => mods[m.key as keyof typeof mods]).map(m => m.label).join(', ')}
                  </span>
                </div>
              )}

              {selectedAddOns.length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-stone-500 text-sm">Add-ons</span>
                  <div className="text-right">
                    {selectedAddOns.map(sel => {
                      const ao = addOns.find(a => a.id === sel.addOnId)
                      return ao ? (
                        <div key={sel.addOnId} className="text-stone-300 text-sm">
                          {ao.name} × {sel.quantity}
                          <span className="text-amber-400 ml-2">QAR {(Number(ao.priceQAR) * sel.quantity).toFixed(2)}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
                <span className="text-stone-400 text-sm">Total Price</span>
                <span className="text-amber-400 font-bold text-2xl">QAR {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-5">
              <label className="text-stone-300 text-sm font-medium block mb-2">
                Special notes <span className="text-stone-600">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Less salt, extra chunky, no garlic…"
                rows={3}
                className="w-full bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors text-sm font-medium">
                ← Back
              </button>
              <button
                onClick={handleProceed}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-sm transition-colors"
              >
                {submitting ? 'Saving…' : 'Proceed to Checkout →'}
              </button>
            </div>
          </div>
        )}

        {/* Floating price pill */}
        {totalPrice > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur border border-amber-500/30 rounded-full px-6 py-2.5 flex items-center gap-3 shadow-xl z-50">
            <span className="text-stone-400 text-sm">Your jar</span>
            <span className="text-amber-400 font-bold text-lg">QAR {totalPrice.toFixed(2)}</span>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Fruits', 'Spice', 'Extras', 'Review']
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const n    = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                active ? 'bg-amber-500 text-stone-950'
                : done  ? 'bg-amber-700 text-amber-200'
                        : 'bg-stone-800 text-stone-500'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-amber-400' : 'text-stone-600'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 sm:w-16 h-px mx-1 mb-4 ${done ? 'bg-amber-700' : 'bg-stone-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
