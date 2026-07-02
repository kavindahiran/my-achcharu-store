import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      orderCounts,
      pendingPayments,
      recentOrders,
      revenueResult,
    ] = await Promise.all([

      // Order counts per status
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Unverified bank transfer payments
      prisma.payment.count({
        where: { paymentStatus: 'PENDING_VERIFICATION', paymentMethod: 'BANK_TRANSFER' },
      }),

      // Last 8 orders
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id:            true,
          orderNumber:   true,
          status:        true,
          paymentMethod: true,
          totalPriceQAR: true,
          createdAt:     true,
          user:            { select: { name: true } },
          deliveryDetails: { select: { recipientName: true, zone: true } },
        },
      }),

      // Total revenue from completed orders
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalPriceQAR: true },
      }),
    ])

    const counts = Object.fromEntries(
      orderCounts.map(r => [r.status, r._count.id])
    )

    return NextResponse.json({
      counts: {
        PENDING:          counts['PENDING']          ?? 0,
        PROCESSING:       counts['PROCESSING']       ?? 0,
        OUT_FOR_DELIVERY: counts['OUT_FOR_DELIVERY'] ?? 0,
        COMPLETED:        counts['COMPLETED']        ?? 0,
        CANCELLED:        counts['CANCELLED']        ?? 0,
      },
      pendingPayments,
      totalRevenue: Number(revenueResult._sum.totalPriceQAR ?? 0),
      recentOrders: recentOrders.map(o => ({
        id:            o.id,
        orderNumber:   o.orderNumber,
        status:        o.status,
        paymentMethod: o.paymentMethod,
        totalPriceQAR: Number(o.totalPriceQAR),
        createdAt:     o.createdAt,
        customerName:  o.deliveryDetails?.recipientName ?? o.user?.name ?? 'Unknown',
        zone:          o.deliveryDetails?.zone ?? '',
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}
