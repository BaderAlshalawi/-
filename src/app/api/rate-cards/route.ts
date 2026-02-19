import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeAllRatesFromMonthly, COSTING_DEFAULTS } from '@/lib/resource-costing'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teamTypeId = request.nextUrl.searchParams.get('teamTypeId')
  const gradeRoleId = request.nextUrl.searchParams.get('gradeRoleId')
  const activeOnly = request.nextUrl.searchParams.get('activeOnly') !== 'false'

  const where: any = {}
  if (teamTypeId) where.teamTypeId = teamTypeId
  if (gradeRoleId) where.gradeRoleId = gradeRoleId
  if (activeOnly) where.isActive = true

  const cards = await prisma.rateCard.findMany({
    where,
    include: {
      teamType: { select: { id: true, name: true } },
      gradeRole: { select: { id: true, name: true } },
    },
    orderBy: [{ teamType: { name: 'asc' } }, { gradeRole: { name: 'asc' } }],
  })

  return NextResponse.json({ cards })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { teamTypeId, gradeRoleId, monthlyCost, effectiveFrom, effectiveTo } = body

  if (!teamTypeId || !gradeRoleId || monthlyCost == null) {
    return NextResponse.json({ error: 'teamTypeId, gradeRoleId, and monthlyCost are required' }, { status: 400 })
  }

  if (monthlyCost < 0) {
    return NextResponse.json({ error: 'monthlyCost must be >= 0' }, { status: 400 })
  }

  const rates = computeAllRatesFromMonthly(Number(monthlyCost))

  try {
    const card = await prisma.rateCard.create({
      data: {
        teamTypeId,
        gradeRoleId,
        monthlyCost: rates.monthly,
        dailyCost: rates.daily,
        hourlyCost: rates.hourly,
        currency: 'SAR',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
      include: {
        teamType: { select: { id: true, name: true } },
        gradeRole: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ card }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Rate card already exists for this team type, grade/role, and effective date' }, { status: 409 })
    }
    throw e
  }
}
