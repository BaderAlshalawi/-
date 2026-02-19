import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const portfolioId = request.nextUrl.searchParams.get('portfolioId')
  if (!portfolioId) return NextResponse.json({ error: 'portfolioId required' }, { status: 400 })

  const items = await prisma.lookupFeature.findMany({
    where: { portfolioId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { portfolioId, name, sortOrder } = await request.json()
  if (!portfolioId || !name?.trim()) {
    return NextResponse.json({ error: 'portfolioId and name required' }, { status: 400 })
  }

  try {
    const item = await prisma.lookupFeature.create({
      data: { portfolioId, name: name.trim(), sortOrder: sortOrder ?? 0 },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Feature name already exists in this portfolio' }, { status: 409 })
    }
    throw e
  }
}
