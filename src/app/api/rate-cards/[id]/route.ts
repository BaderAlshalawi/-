import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeAllRatesFromMonthly } from '@/lib/resource-costing'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const data: any = {}

  if (body.monthlyCost !== undefined) {
    const rates = computeAllRatesFromMonthly(Number(body.monthlyCost))
    data.monthlyCost = rates.monthly
    data.dailyCost = rates.daily
    data.hourlyCost = rates.hourly
  }
  if (body.effectiveFrom !== undefined) data.effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : null
  if (body.effectiveTo !== undefined) data.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : null
  if (body.isActive !== undefined) data.isActive = body.isActive

  try {
    const card = await prisma.rateCard.update({
      where: { id: params.id },
      data,
      include: {
        teamType: { select: { id: true, name: true } },
        gradeRole: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ card })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.rateCard.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }
}
