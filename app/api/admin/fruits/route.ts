import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') throw new Error('Unauthorized')
}

// GET — all fruits ordered by sortOrder
export async function GET() {
  try {
    await requireAdmin()
    const fruits = await prisma.fruitPrice.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(fruits)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST — create a new fruit
// body: { name, emoji?, description?, priceQAR, sortOrder? }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { name, emoji, description, priceQAR, sortOrder } = await req.json()

    if (!name || priceQAR == null || priceQAR <= 0) {
      return NextResponse.json({ error: 'name and priceQAR > 0 required' }, { status: 400 })
    }

    // Auto-generate key from name: "Jambu Rose" → "JAMBU_ROSE"
    const fruit = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')

    const existing = await prisma.fruitPrice.findUnique({ where: { fruit } })
    if (existing) {
      return NextResponse.json({ error: `A fruit with key "${fruit}" already exists.` }, { status: 409 })
    }

    const created = await prisma.fruitPrice.create({
      data: {
        fruit,
        name: name.trim(),
        emoji: emoji ?? '🍑',
        description: description ?? null,
        priceQAR,
        isActive: true,
        sortOrder: sortOrder ?? 99,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// PATCH — update a fruit's metadata and/or price
// body: { id, name?, emoji?, description?, priceQAR?, isActive?, sortOrder? }
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, name, emoji, description, priceQAR, isActive, sortOrder } = await req.json()

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updated = await prisma.fruitPrice.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(emoji       !== undefined && { emoji }),
        ...(description !== undefined && { description }),
        ...(priceQAR    !== undefined && { priceQAR }),
        ...(isActive    !== undefined && { isActive }),
        ...(sortOrder   !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
