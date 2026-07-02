import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// PATCH /api/admin/products/[id] — update a product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()

    const data: Record<string, any> = {}
    if (body.name        != null) data.name        = body.name
    if (body.description != null) data.description = body.description
    if (body.priceQAR    != null) data.priceQAR    = body.priceQAR
    if (body.imageUrl    != null) data.imageUrl    = body.imageUrl
    if (body.stockLevel  != null) data.stockLevel  = body.stockLevel
    if (body.isAvailable != null) data.isAvailable = body.isAvailable
    if (body.isFeatured  != null) data.isFeatured  = body.isFeatured

    const product = await prisma.achcharuProduct.update({ where: { id }, data })

    return NextResponse.json(product)
  } catch (e: any) {
    console.error('[PATCH /api/admin/products/:id]', e)
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] — hard delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.achcharuProduct.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}
