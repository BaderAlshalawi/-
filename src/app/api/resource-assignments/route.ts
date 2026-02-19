import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManage = await canPerform(user, 'resource:manage')
    const canView = await canPerform(user, 'resource:view-utilisation')
    if (!canManage && !canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const productId = searchParams.get('productId')
    const releaseId = searchParams.get('releaseId')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (productId) where.productId = productId
    if (releaseId) where.releaseId = releaseId
    if (userId) where.userId = userId

    const [assignments, total] = await Promise.all([
      prisma.resourceAssignment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          product: { select: { id: true, name: true, code: true } },
          assignedBy: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.resourceAssignment.count({ where }),
    ])

    return NextResponse.json({
      assignments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Get resource assignments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'resource:create-assignment')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId: targetUserId, productId, releaseId, utilisation, startDate, endDate } = await request.json()

    if (!targetUserId || !productId || utilisation === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, productId, utilisation, startDate, and endDate are required' },
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const monthlyCost = targetUser.costRate
      ? Number(targetUser.costRate) * (utilisation / 100)
      : null

    const assignment = await prisma.resourceAssignment.create({
      data: {
        userId: targetUserId,
        productId,
        releaseId: releaseId || null,
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
      actor: user,
      action: AuditAction.CREATE,
      entityType: EntityType.RESOURCE_ASSIGNMENT,
      entityId: assignment.id,
      entityName: `${targetUser.name} → ${product.name}`,
      comment: `Resource assignment created: ${utilisation}% utilisation`,
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate assignment for this user/product/release/start date combination' },
        { status: 409 }
      )
    }
    console.error('Create resource assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
