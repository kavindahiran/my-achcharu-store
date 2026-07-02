import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/admin/payments — returns all pending verification payments
export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'PENDING_VERIFICATION'

  const payments = await prisma.payment.findMany({
    where: { paymentStatus: status as any },
    include: {
      order: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          deliveryDetails: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(payments)
}

// PATCH /api/admin/payments — admin verifies or rejects a bank transfer
export async function PATCH(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paymentId, paymentStatus, adminNotes } = await req.json()

  if (!paymentId || !paymentStatus) {
    return NextResponse.json(
      { error: 'Payment ID and status are required' },
      { status: 400 }
    )
  }

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paymentStatus,
      adminNotes: adminNotes ?? null,
      verifiedAt: new Date(),
      verifiedById: session.user.id,
    },
  })

  // Move order to PROCESSING when payment is confirmed
  if (paymentStatus === 'PAID') {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PROCESSING' },
    })
  }

  return NextResponse.json(payment)
}
