import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const costs = await prisma.hostingCost.findMany({
    where: { portfolioId: params.id },
    orderBy: { category: 'asc' },
  })

  const total = costs.reduce((sum, c) => sum + Number(c.amount), 0)

  return NextResponse.json({ costs, total })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { category, amount, notes, period } = body

  const validCategories = ['LICENSE', 'INFRA', 'OTHERS', 'INDIRECT']
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category. Must be LICENSE, INFRA, OTHERS, or INDIRECT' }, { status: 400 })
  }
  if (amount == null || Number(amount) < 0) {
    return NextResponse.json({ error: 'amount must be >= 0' }, { status: 400 })
  }

  const cost = await prisma.hostingCost.create({
    data: {
      portfolioId: params.id,
      category,
      amount: Number(amount),
      currency: 'SAR',
      notes: notes || null,
      period: period || null,
    },
  })

  return NextResponse.json({ cost }, { status: 201 })
}
