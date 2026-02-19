import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  lookupHourlyCost,
  computeAllocationCosts,
  normalizeUtilization,
} from '@/lib/resource-costing'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; allocationId: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PROGRAM_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const existing = await prisma.portfolioResourceAllocation.findUnique({
    where: { id: params.allocationId },
  })
  if (!existing || existing.portfolioId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const data: any = { updatedById: user.id }

  if (body.featureId !== undefined) data.featureId = body.featureId || null
  if (body.phaseId !== undefined) data.phaseId = body.phaseId
  if (body.quarterId !== undefined) data.quarterId = body.quarterId || null
  if (body.teamTypeId !== undefined) data.teamTypeId = body.teamTypeId
  if (body.positionId !== undefined) data.positionId = body.positionId || null
  if (body.gradeRoleId !== undefined) data.gradeRoleId = body.gradeRoleId

  const teamTypeId = data.teamTypeId ?? existing.teamTypeId
  const gradeRoleId = data.gradeRoleId ?? existing.gradeRoleId

  let hourlyCost = Number(existing.hourlyCostSnapshot)
  if (body.hourlyCostOverride != null) {
    hourlyCost = Number(body.hourlyCostOverride)
  } else if (body.teamTypeId || body.gradeRoleId) {
    const rate = await lookupHourlyCost(teamTypeId, gradeRoleId)
    if (rate != null) hourlyCost = rate
  }

  const actualHours = body.actualHours != null ? Number(body.actualHours) : Number(existing.actualHours)
  const rawUtil = body.utilization != null ? Number(body.utilization) : Number(existing.utilization)
  const utilization = normalizeUtilization(rawUtil)

  const { actualCost, durationDays } = computeAllocationCosts({
    hourlyCost,
    actualHours,
    utilization,
  })

  data.hourlyCostSnapshot = hourlyCost
  data.actualHours = actualHours
  data.utilization = utilization
  data.actualCostComputed = actualCost
  data.durationDaysComputed = durationDays

  const allocation = await prisma.portfolioResourceAllocation.update({
    where: { id: params.allocationId },
    data,
    include: {
      feature: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true } },
      quarter: { select: { id: true, name: true } },
      teamType: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      gradeRole: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ allocation })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; allocationId: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'PROGRAM_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const existing = await prisma.portfolioResourceAllocation.findUnique({
      where: { id: params.allocationId },
    })
    if (!existing || existing.portfolioId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.portfolioResourceAllocation.delete({
      where: { id: params.allocationId },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }
}
