import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Get all products in this portfolio
    const products = await prisma.product.findMany({
      where: { portfolioId: params.id },
      select: { id: true },
    })
    const productIds = products.map((p) => p.id)

    if (productIds.length === 0) {
      return NextResponse.json({
        assignments: [],
        summary: {
          totalAssignments: 0,
          uniqueResources: 0,
          averageUtilisation: 0,
          totalMonthlyCost: 0,
        },
      })
    }

    // Get resource assignments for all products in this portfolio
    const assignments = await prisma.resourceAssignment.findMany({
      where: { productId: { in: productIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            costRate: true,
            costRateCurrency: true,
          },
        },
        product: {
          select: { id: true, name: true, code: true },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate summary
    const uniqueResourceIds = new Set(assignments.map((a) => a.userId))
    const totalMonthlyCost = assignments.reduce(
      (sum, a) => sum + (a.monthlyRateCached ? Number(a.monthlyRateCached) : 0),
      0
    )
    const avgUtil =
      assignments.length > 0
        ? assignments.reduce((sum, a) => sum + Number(a.utilisation), 0) / assignments.length
        : 0

    return NextResponse.json({
      assignments,
      summary: {
        totalAssignments: assignments.length,
        uniqueResources: uniqueResourceIds.size,
        averageUtilisation: Math.round(avgUtil),
        totalMonthlyCost,
      },
    })
  } catch (error) {
    console.error('Get portfolio resources error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId: targetUserId, productId, utilisation, startDate, endDate, notes } = body

    if (!targetUserId || !productId || utilisation === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, productId, utilisation, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Validate product belongs to this portfolio
    const product = await prisma.product.findFirst({
      where: { id: productId, portfolioId: params.id },
      select: { id: true, name: true },
    })
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found in this portfolio' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      return NextResponse.json({ error: 'startDate must be before endDate' }, { status: 400 })
    }

    if (utilisation < 0 || utilisation > 200) {
      return NextResponse.json({ error: 'Utilisation must be between 0 and 200' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, costRate: true, status: true },
    })
    if (!targetUser || targetUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Target user not found or inactive' }, { status: 404 })
    }

    const monthlyCost = targetUser.costRate
      ? Number(targetUser.costRate) * (utilisation / 100)
      : null

    const assignment = await prisma.resourceAssignment.create({
      data: {
        userId: targetUserId,
        productId,
        utilisation,
        startDate: start,
        endDate: end,
        monthlyRateCached: monthlyCost,
        assignedById: user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        product: { select: { id: true, name: true, code: true } },
      },
    })

    await createAuditLog({
      actor: user as any,
      action: AuditAction.CREATE,
      entityType: EntityType.RESOURCE_ASSIGNMENT,
      entityId: assignment.id,
      entityName: `${targetUser.name} → ${product.name}`,
      comment: `Resource assigned to portfolio "${portfolio.name}": ${utilisation}% utilisation${notes ? ` - ${notes}` : ''}`,
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate assignment for this user/product/date combination' },
        { status: 409 }
      )
    }
    console.error('Create portfolio resource assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
