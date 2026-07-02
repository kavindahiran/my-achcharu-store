import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/admin/orders — returns all orders for admin dashboard
export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      items: {
        include: {
          product: true,
          customAchcharu: {
            include: { addOns: { include: { addOn: true } } },
          },
        },
      },
      deliveryDetails: true,
      payment: true,
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
