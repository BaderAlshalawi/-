import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  lookupHourlyCost,
  computeAllocationCosts,
  normalizeUtilization,
  computePortfolioLaborTotal,
  computePortfolioHostingTotal,
} from '@/lib/resource-costing'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const portfolioId = params.id

  const allocations = await prisma.portfolioResourceAllocation.findMany({
    where: { portfolioId },
    include: {
      feature: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true } },
      quarter: { select: { id: true, name: true } },
      teamType: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      gradeRole: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const [laborTotal, hostingTotal] = await Promise.all([
    computePortfolioLaborTotal(portfolioId),
    computePortfolioHostingTotal(portfolioId),
  ])

  return NextResponse.json({
    allocations,
    totals: {
      laborCostTotal: laborTotal,
      hostingCostTotal: hostingTotal,
      portfolioTotalCost: laborTotal + hostingTotal,
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PROGRAM_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const portfolioId = params.id
  const body = await request.json()
  const {
    featureId, phaseId, quarterId, teamTypeId, positionId, gradeRoleId,
    actualHours, utilization: rawUtilization, hourlyCostOverride,
  } = body

  if (!phaseId || !teamTypeId || !gradeRoleId) {
    return NextResponse.json({ error: 'phaseId, teamTypeId, and gradeRoleId are required' }, { status: 400 })
  }
  if (actualHours == null || Number(actualHours) < 0) {
    return NextResponse.json({ error: 'actualHours must be >= 0' }, { status: 400 })
  }
  if (rawUtilization == null) {
    return NextResponse.json({ error: 'utilization is required' }, { status: 400 })
  }

  let hourlyCost: number
  if (hourlyCostOverride != null) {
    hourlyCost = Number(hourlyCostOverride)
  } else {
    const rate = await lookupHourlyCost(teamTypeId, gradeRoleId)
    if (rate == null) {
      return NextResponse.json(
        { error: 'No rate card found for this team type and grade/role. Create a rate card first or provide hourlyCostOverride.' },
        { status: 400 }
      )
    }
    hourlyCost = rate
  }

  const utilization = normalizeUtilization(Number(rawUtilization))
  const { actualCost, durationDays } = computeAllocationCosts({
    hourlyCost,
    actualHours: Number(actualHours),
    utilization,
  })

  const allocation = await prisma.portfolioResourceAllocation.create({
    data: {
      portfolioId,
      featureId: featureId || null,
      phaseId,
      quarterId: quarterId || null,
      teamTypeId,
      positionId: positionId || null,
      gradeRoleId,
      hourlyCostSnapshot: hourlyCost,
      actualHours: Number(actualHours),
      utilization,
      actualCostComputed: actualCost,
      durationDaysComputed: durationDays,
      currency: 'SAR',
      createdById: user.id,
      updatedById: user.id,
    },
    include: {
      feature: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true } },
      quarter: { select: { id: true, name: true } },
      teamType: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      gradeRole: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ allocation }, { status: 201 })
}
