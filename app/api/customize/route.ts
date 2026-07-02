import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [addOns, fruitRows, mixPrices, spiceOptions] = await Promise.all([
    prisma.addOn.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.fruitPrice.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.fruitMixPrice.findMany({ where: { isActive: true } }),
    prisma.spiceOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return NextResponse.json({
    addOns,
    // Full fruit catalogue for the shelf UI
    fruits: fruitRows.map(f => ({
      fruit:       f.fruit,
      name:        f.name,
      emoji:       f.emoji,
      description: f.description,
      priceQAR:    Number(f.priceQAR),
    })),
    // Convenience map for pricing lookups: { MANGO: 25, ... }
    fruitPrices: Object.fromEntries(fruitRows.map(f => [f.fruit, Number(f.priceQAR)])),
    mixPrices: mixPrices.map(mp => ({
      fruitsKey: mp.fruitsKey,
      label:     mp.label,
      priceQAR:  Number(mp.priceQAR),
    })),
    spiceOptions: spiceOptions.map(so => ({
      key:         so.key,
      label:       so.label,
      emoji:       so.emoji,
      description: so.description,
      multiplier:  Number(so.multiplier),
    })),
  })
}

export async function POST(req: NextRequest) {
  const {
    baseFruits,
    spiceLevel,
    extraSweet, extraSour, extraMustard, extraGarlic,
    customNotes,
    addOns,
    userId,
  } = await req.json()

  if (!baseFruits || baseFruits.length === 0 || !spiceLevel) {
    return NextResponse.json(
      { error: 'At least one fruit and a spice level are required' },
      { status: 400 }
    )
  }

  // ── Look up the admin-defined price for this exact fruit selection ──────────
  let basePrice: number

  if (baseFruits.length === 1) {
    const fp = await prisma.fruitPrice.findUnique({ where: { fruit: baseFruits[0] } })
    if (!fp) {
      return NextResponse.json(
        { error: `No price set for ${baseFruits[0]}. Please contact the seller.` },
        { status: 400 }
      )
    }
    basePrice = Number(fp.priceQAR)
  } else {
    const fruitsKey = [...baseFruits].sort().join(',')
    const mp = await prisma.fruitMixPrice.findUnique({ where: { fruitsKey, isActive: true } })
    if (!mp) {
      return NextResponse.json(
        { error: 'This fruit combination does not have a set price. Please try a different mix.' },
        { status: 400 }
      )
    }
    basePrice = Number(mp.priceQAR)
  }

  // ── Look up spice multiplier from DB ────────────────────────────────────────
  const spice = await prisma.spiceOption.findUnique({ where: { key: spiceLevel, isActive: true } })
  if (!spice) {
    return NextResponse.json(
      { error: 'Invalid spice level selected.' },
      { status: 400 }
    )
  }
  const multiplier = Number(spice.multiplier)

  // ── Add-on total from DB prices ─────────────────────────────────────────────
  let addOnTotal = 0
  if (addOns && addOns.length > 0) {
    const dbAddOns = await prisma.addOn.findMany({
      where: { id: { in: addOns.map((a: any) => a.addOnId) } },
    })
    addOnTotal = addOns.reduce((sum: number, sel: any) => {
      const ao = dbAddOns.find(a => a.id === sel.addOnId)
      return sum + (ao ? Number(ao.priceQAR) * sel.quantity : 0)
    }, 0)
  }

  const totalPriceQAR = basePrice * multiplier + addOnTotal

  const customBuild = await prisma.customAchcharu.create({
    data: {
      userId: userId ?? null,
      baseFruit: JSON.stringify(baseFruits),
      spiceLevel,
      extraSweet: extraSweet ?? false,
      extraSour: extraSour ?? false,
      extraMustard: extraMustard ?? false,
      extraGarlic: extraGarlic ?? false,
      customNotes: customNotes ?? null,
      basePrice,
      priceMultiplier: multiplier,
      totalPriceQAR,
      addOns: {
        create: addOns?.map((a: any) => ({ addOnId: a.addOnId, quantity: a.quantity })) ?? [],
      },
    },
  })

  return NextResponse.json({ customBuild, totalPriceQAR }, { status: 201 })
}
