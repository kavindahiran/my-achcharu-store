import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN')
    throw new Error('Unauthorized')
}

// GET /api/admin/fruit-prices — all fruit prices
export async function GET() {
  try {
    await requireAdmin()
    const prices = await prisma.fruitPrice.findMany({ orderBy: { fruit: 'asc' } })
    return NextResponse.json(prices)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PATCH /api/admin/fruit-prices — update a single fruit price
// body: { fruit: string, priceQAR: number }
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { fruit, priceQAR } = await req.json()

    if (!fruit || priceQAR == null || priceQAR <= 0) {
      return NextResponse.json({ error: 'fruit and priceQAR > 0 required' }, { status: 400 })
    }

    const updated = await prisma.fruitPrice.upsert({
      where: { fruit },
      update: { priceQAR },
      create: { fruit, priceQAR },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
