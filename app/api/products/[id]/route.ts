import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/products/:id — public, returns single product by id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await prisma.achcharuProduct.findUnique({
    where: { id },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

// PATCH /api/products/:id — admin only, updates a product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const data = await req.json()

  const product = await prisma.achcharuProduct.update({
    where: { id },
    data,
  })

  return NextResponse.json(product)
}

// DELETE /api/products/:id — admin only, deletes a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.achcharuProduct.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Product deleted' })
}