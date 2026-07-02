import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') throw new Error('Unauthorized')
}

// GET — all add-ons ordered by sortOrder
export async function GET() {
  try {
    await requireAdmin()
    const addOns = await prisma.addOn.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(addOns)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST — create a new add-on
// body: { name, description?, priceQAR, sortOrder? }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { name, description, priceQAR, sortOrder } = await req.json()

    if (!name || priceQAR == null || priceQAR <= 0) {
      return NextResponse.json({ error: 'name and priceQAR > 0 required' }, { status: 400 })
    }

    // Auto-generate type key from name: "Lime Pickle" → "LIME_PICKLE"
    const type = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')

    const existing = await prisma.addOn.findUnique({ where: { type } })
    if (existing) {
      return NextResponse.json({ error: `An extra with key "${type}" already exists.` }, { status: 409 })
    }

    const addOn = await prisma.addOn.create({
      data: {
        type,
        name: name.trim(),
        description: description ?? null,
        priceQAR,
        isAvailable: true,
        sortOrder: sortOrder ?? 99,
      },
    })

    return NextResponse.json(addOn, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// PATCH — update name, description, price, availability
// body: { id, name?, description?, priceQAR?, isAvailable?, sortOrder? }
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, name, description, priceQAR, isAvailable, sortOrder } = await req.json()

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updated = await prisma.addOn.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(priceQAR    !== undefined && { priceQAR }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(sortOrder   !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
