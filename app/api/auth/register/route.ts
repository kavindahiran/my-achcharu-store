import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email and password are required' },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  return NextResponse.json(
    { message: 'Account created successfully', userId: user.id },
    { status: 201 }
  )
}
