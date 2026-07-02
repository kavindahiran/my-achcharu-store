import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') throw new Error('Unauthorized')
}

// GET — all spice options ordered by sortOrder
export async function GET() {
  try {
    await requireAdmin()
    const options = await prisma.spiceOption.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(options)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST — create a new spice option
// body: { label, emoji?, description?, multiplier, sortOrder? }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { label, emoji, description, multiplier, sortOrder } = await req.json()

    if (!label || multiplier == null || multiplier <= 0) {
      return NextResponse.json({ error: 'label and multiplier > 0 required' }, { status: 400 })
    }

    // Auto-generate key from label: "Ghost Pepper" → "GHOST_PEPPER"
    const key = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')

    const existing = await prisma.spiceOption.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json({ error: `A spice level with key "${key}" already exists.` }, { status: 409 })
    }

    const opt = await prisma.spiceOption.create({
      data: {
        key,
        label: label.trim(),
        emoji: emoji ?? '🌶️',
        description: description ?? null,
        multiplier,
        isActive: true,
        sortOrder: sortOrder ?? 99,
      },
    })

    return NextResponse.json(opt, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// PATCH — update an existing spice option
// body: { id, label?, emoji?, description?, multiplier?, isActive?, sortOrder? }
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, label, emoji, description, multiplier, isActive, sortOrder } = await req.json()

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updated = await prisma.spiceOption.update({
      where: { id },
      data: {
        ...(label       !== undefined && { label }),
        ...(emoji       !== undefined && { emoji }),
        ...(description !== undefined && { description }),
        ...(multiplier  !== undefined && { multiplier }),
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

// DELETE — remove a spice option by id
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { id } = await req.json()
    await prisma.spiceOption.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
