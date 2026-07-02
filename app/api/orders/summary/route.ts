import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const customId = req.nextUrl.searchParams.get('customId')
    if (!customId) return NextResponse.json({ error: 'customId required' }, { status: 400 })

    const custom = await prisma.customAchcharu.findUnique({
      where: { id: customId },
      include: { addOns: { include: { addOn: true } } },
    })

    if (!custom) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const baseFruits = JSON.parse(custom.baseFruit) as string[]

    const [fruitRows, spice] = await Promise.all([
      prisma.fruitPrice.findMany({
        where: { fruit: { in: baseFruits } },
        select: { fruit: true, name: true, emoji: true },
      }),
      prisma.spiceOption.findUnique({
        where: { key: custom.spiceLevel },
        select: { label: true, emoji: true },
      }),
    ])

    return NextResponse.json({
      id:           custom.id,
      fruits:       fruitRows,
      spice,
      extraSweet:   custom.extraSweet,
      extraSour:    custom.extraSour,
      extraMustard: custom.extraMustard,
      extraGarlic:  custom.extraGarlic,
      customNotes:  custom.customNotes,
      addOns: custom.addOns.map(a => ({
        name:      a.addOn.name,
        quantity:  a.quantity,
        subtotal:  Number(a.addOn.priceQAR) * a.quantity,
      })),
      totalPriceQAR: Number(custom.totalPriceQAR),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
