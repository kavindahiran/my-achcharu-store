import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base
  let n = 0
  while (true) {
    const existing = await prisma.achcharuProduct.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    slug = `${base}-${++n}`
  }
}

// GET /api/admin/products — all products (including unavailable)
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const products = await prisma.achcharuProduct.findMany({
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(products)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}

// POST /api/admin/products — create a new product
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, description, priceQAR, imageUrl, stockLevel, isAvailable, isFeatured } = body

    if (!name || !description || priceQAR == null)
      return NextResponse.json({ error: 'name, description, and priceQAR are required' }, { status: 400 })

    const slug = await uniqueSlug(toSlug(name))

    const product = await prisma.achcharuProduct.create({
      data: {
        name,
        slug,
        description,
        priceQAR,
        imageUrl:    imageUrl    ?? '🫙',
        stockLevel:  stockLevel  ?? 0,
        isAvailable: isAvailable ?? true,
        isFeatured:  isFeatured  ?? false,
        ingredients: [],
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}
