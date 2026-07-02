import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/lib/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file)                        return NextResponse.json({ error: 'No file uploaded' },                   { status: 400 })
    if (file.size > MAX_SIZE)         return NextResponse.json({ error: 'File too large (max 2 MB)' },          { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP or GIF allowed' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder:        'achcharu-admin',
      resource_type: 'image',
    })

    return NextResponse.json({ url: uploaded.secure_url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
