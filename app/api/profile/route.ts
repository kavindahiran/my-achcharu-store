import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/profile — current user's profile
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/profile — update name, phone, and/or password
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone, currentPassword, newPassword } = await req.json()

    const data: Record<string, any> = {}
    if (name?.trim())  data.name  = name.trim()
    if (phone !== undefined) data.phone = phone?.trim() || null

    // Password change requires current password verification
    if (newPassword) {
      if (!currentPassword)
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      if (newPassword.length < 6)
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })

      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

      data.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 })
  }
}
