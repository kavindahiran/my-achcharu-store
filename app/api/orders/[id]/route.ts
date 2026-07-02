import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendOrderConfirmed, sendOutForDelivery, type OrderEmailData } from '@/lib/mailer'

// GET /api/orders/:id — returns a single order (owner, admin, or guest order)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id }  = await params

  const order = await prisma.order.findUnique({
    where: { id },
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
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Guest orders (userId null) are accessible by orderId — the CUID is the secret
  // Logged-in users can only view their own orders unless admin
  if (order.userId !== null) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Enrich custom achcharu item with fruit / spice display names
  const custom = order.items.find(i => i.customAchcharu)?.customAchcharu ?? null
  let fruits: { fruit: string; name: string; emoji: string }[] = []
  let spice: { label: string; emoji: string } | null = null

  if (custom) {
    const baseFruits = JSON.parse(custom.baseFruit) as string[]
    const [fruitRows, spiceRow] = await Promise.all([
      prisma.fruitPrice.findMany({
        where: { fruit: { in: baseFruits } },
        select: { fruit: true, name: true, emoji: true },
      }),
      prisma.spiceOption.findUnique({
        where: { key: custom.spiceLevel },
        select: { label: true, emoji: true },
      }),
    ])
    fruits = fruitRows
    spice  = spiceRow
  }

  return NextResponse.json({
    id:            order.id,
    orderNumber:   order.orderNumber,
    status:        order.status,
    paymentMethod: order.paymentMethod,
    subtotalQAR:   Number(order.subtotalQAR),
    deliveryFeeQAR: Number(order.deliveryFeeQAR),
    totalPriceQAR: Number(order.totalPriceQAR),
    createdAt:     order.createdAt,
    deliveryDetails: order.deliveryDetails,
    payment: order.payment ? {
      id:              order.payment.id,
      paymentStatus:   order.payment.paymentStatus,
      receiptImageUrl: order.payment.receiptImageUrl,
      bankName:        order.payment.bankName,
      transferReference: order.payment.transferReference,
    } : null,
    custom: custom ? {
      baseFruits:   JSON.parse(custom.baseFruit),
      fruits,
      spice,
      extraSweet:   custom.extraSweet,
      extraSour:    custom.extraSour,
      extraMustard: custom.extraMustard,
      extraGarlic:  custom.extraGarlic,
      customNotes:  custom.customNotes,
      addOns: custom.addOns.map(a => ({
        name:     a.addOn.name,
        quantity: a.quantity,
        subtotal: Number(a.addOn.priceQAR) * a.quantity,
      })),
      totalPriceQAR: Number(custom.totalPriceQAR),
    } : null,
  })
}

// PATCH /api/orders/:id — admin only, updates order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id }  = await params
    const role    = (session?.user as any)?.role

    if (!session || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()

    // Plain status update — no includes needed (dashboard refreshes via load())
    await prisma.order.update({ where: { id }, data: { status } })

    // Auto-mark COD payment as PAID when order is completed
    if (status === 'COMPLETED') {
      await prisma.payment.updateMany({
        where: { orderId: id, paymentMethod: 'CASH_ON_DELIVERY' },
        data:  { paymentStatus: 'PAID' },
      })
    }

    // Send email — fetch the data needed separately so any email error doesn't block the response
    if (status === 'PROCESSING' || status === 'OUT_FOR_DELIVERY') {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        select: {
          orderNumber:   true,
          totalPriceQAR: true,
          paymentMethod: true,
          user:            { select: { email: true, name: true } },
          deliveryDetails: { select: { recipientName: true, zone: true } },
          items: {
            select: {
              customAchcharu: {
                select: { baseFruit: true, spiceLevel: true },
              },
            },
          },
        },
      })

      if (fullOrder?.user?.email) {
        const custom     = fullOrder.items.find(i => i.customAchcharu)?.customAchcharu ?? null
        const baseFruits = custom ? (JSON.parse(custom.baseFruit) as string[]) : []

        const [fruitRows, spiceRow] = await Promise.all([
          baseFruits.length
            ? prisma.fruitPrice.findMany({ where: { fruit: { in: baseFruits } }, select: { fruit: true, name: true } })
            : Promise.resolve([] as { fruit: string; name: string }[]),
          custom
            ? prisma.spiceOption.findUnique({ where: { key: custom.spiceLevel }, select: { label: true } })
            : Promise.resolve(null),
        ])

        const emailData: OrderEmailData = {
          to:            fullOrder.user.email,
          customerName:  fullOrder.user.name ?? fullOrder.deliveryDetails?.recipientName ?? 'Valued Customer',
          orderNumber:   fullOrder.orderNumber,
          totalQAR:      Number(fullOrder.totalPriceQAR),
          fruits:        baseFruits.map(k => fruitRows.find(f => f.fruit === k)?.name ?? k).join(', '),
          spice:         spiceRow?.label ?? custom?.spiceLevel ?? '',
          paymentMethod: fullOrder.paymentMethod as any,
          zone:          fullOrder.deliveryDetails?.zone ?? '',
        }

        if (status === 'PROCESSING')       sendOrderConfirmed(emailData).catch(console.error)
        if (status === 'OUT_FOR_DELIVERY') sendOutForDelivery(emailData).catch(console.error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[PATCH /api/orders/:id]', e)
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}
