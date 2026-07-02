import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendNewOrderAlert } from '@/lib/mailer'

// GET /api/orders — returns orders for the logged in customer
export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
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
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}

// POST /api/orders — place an order from a custom build (requires auth)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      customId,
      paymentMethod = 'BANK_TRANSFER',
      recipientName, contactPhone,
      zone, street, building,
      apartmentUnit, directions,
      locationLat, locationLng, googleMapsLink,
    } = await req.json()

    if (!customId || !recipientName || !contactPhone || !zone || !street || !building) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['BANK_TRANSFER', 'CASH_ON_DELIVERY'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const custom = await prisma.customAchcharu.findUnique({ where: { id: customId } })
    if (!custom) return NextResponse.json({ error: 'Custom build not found' }, { status: 404 })

    // AQQR-YYYYMMDD-XXXX
    const now      = new Date()
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randPart = String(Math.floor(1000 + Math.random() * 9000))
    const orderNumber = `AQQR-${datePart}-${randPart}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId:         session.user.id,
        paymentMethod:  paymentMethod as any,
        subtotalQAR:    custom.totalPriceQAR,
        deliveryFeeQAR: 0,
        totalPriceQAR:  custom.totalPriceQAR,
        items: {
          create: [{
            customAchcharuId: customId,
            quantity:         1,
            unitPriceQAR:     custom.totalPriceQAR,
            subtotalQAR:      custom.totalPriceQAR,
          }],
        },
        deliveryDetails: {
          create: {
            recipientName,
            contactPhone,
            zone,
            street,
            building,
            apartmentUnit:  apartmentUnit  || null,
            directions:     directions     || null,
            locationLat:    locationLat    ?? null,
            locationLng:    locationLng    ?? null,
            googleMapsLink: googleMapsLink || null,
          },
        },
        payment: {
          create: {
            paymentMethod: paymentMethod as any,
            paymentStatus: 'PENDING_VERIFICATION',
          },
        },
      },
    })

    // Notify admin of new order (fire-and-forget)
    const baseFruits = JSON.parse(custom.baseFruit) as string[]
    Promise.all([
      baseFruits.length
        ? prisma.fruitPrice.findMany({ where: { fruit: { in: baseFruits } }, select: { fruit: true, name: true } })
        : Promise.resolve([] as { fruit: string; name: string }[]),
      prisma.spiceOption.findUnique({ where: { key: custom.spiceLevel }, select: { label: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }),
    ]).then(([fruitRows, spiceRow, user]) => {
      sendNewOrderAlert({
        orderNumber:   orderNumber,
        totalQAR:      Number(custom.totalPriceQAR),
        paymentMethod: paymentMethod as any,
        recipientName,
        contactPhone,
        zone,
        fruits:        baseFruits.map(k => fruitRows.find(f => f.fruit === k)?.name ?? k).join(', '),
        spice:         spiceRow?.label ?? custom.spiceLevel,
        customerEmail: user?.email ?? null,
      }).catch(console.error)
    }).catch(console.error)

    return NextResponse.json({ order }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}