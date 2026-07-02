import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/products — public, returns all available products
export async function GET() {
  const products = await prisma.achcharuProduct.findMany({
    where: { isAvailable: true },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(products)
}

// POST /api/products — admin only, creates a new product
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, slug, description, ingredients, priceQAR, imageUrl, stockLevel } = await req.json()

  if (!name || !slug || !description || !priceQAR || !imageUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const product = await prisma.achcharuProduct.create({
    data: {
      name,
      slug,
      description,
      ingredients,
      priceQAR,
      imageUrl,
      stockLevel: stockLevel ?? 0,
    },
  })

  return NextResponse.json(product, { status: 201 })
}