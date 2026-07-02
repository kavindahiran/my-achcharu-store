import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') throw new Error('Unauthorized')
}

// GET — all mix prices
export async function GET() {
  try {
    await requireAdmin()
    const mixes = await prisma.fruitMixPrice.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(mixes)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST — create or update a mix price
// body: { fruits: string[], priceQAR: number, label?: string }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { fruits, priceQAR, label } = await req.json()

    if (!fruits || fruits.length < 2) {
      return NextResponse.json({ error: 'A mix requires at least 2 fruits' }, { status: 400 })
    }
    if (!priceQAR || priceQAR <= 0) {
      return NextResponse.json({ error: 'priceQAR > 0 required' }, { status: 400 })
    }

    const fruitsKey = [...fruits].sort().join(',')
    const autoLabel = label ?? fruits.map((f: string) => f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, ' ')).join(' + ')

    const mix = await prisma.fruitMixPrice.upsert({
      where: { fruitsKey },
      update: { priceQAR, label: autoLabel, isActive: true },
      create: { fruitsKey, label: autoLabel, priceQAR, isActive: true },
    })

    return NextResponse.json(mix, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// DELETE — remove a mix price by fruitsKey
// body: { fruitsKey: string }
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { fruitsKey } = await req.json()
    await prisma.fruitMixPrice.delete({ where: { fruitsKey } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
