import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/payments/upload — uploads bank transfer receipt image
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('receipt') as File
  const orderId = formData.get('orderId') as string
  const bankName = formData.get('bankName') as string
  const transferReference = formData.get('transferReference') as string

  if (!file || !orderId) {
    return NextResponse.json(
      { error: 'Receipt image and order ID are required' },
      { status: 400 }
    )
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })

  // Guest orders (userId null) can be claimed by any logged-in user who has the orderId
  if (!order || (order.userId !== null && order.userId !== session.user.id)) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Convert file to base64 for Cloudinary upload
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  const uploaded = await cloudinary.uploader.upload(base64, {
    folder: 'achcharu-receipts',
    resource_type: 'image',
  })

  // Update payment record with receipt details
  const payment = await prisma.payment.update({
    where: { orderId },
    data: {
      receiptImageUrl: uploaded.secure_url,
      bankName: bankName ?? null,
      transferReference: transferReference ?? null,
      paymentStatus: 'PENDING_VERIFICATION',
    },
  })

  return NextResponse.json(payment)
}
