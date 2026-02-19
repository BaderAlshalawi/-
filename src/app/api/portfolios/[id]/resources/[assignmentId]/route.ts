import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignment = await prisma.resourceAssignment.findUnique({
      where: { id: params.assignmentId },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, portfolioId: true } },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.product.portfolioId !== params.id) {
      return NextResponse.json({ error: 'Assignment does not belong to this portfolio' }, { status: 400 })
    }

    await prisma.resourceAssignment.delete({ where: { id: params.assignmentId } })

    await createAuditLog({
      actor: user as any,
      action: AuditAction.DELETE,
      entityType: EntityType.RESOURCE_ASSIGNMENT,
      entityId: params.assignmentId,
      entityName: `${assignment.user.name} → ${assignment.product.name}`,
      comment: 'Resource assignment removed',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete portfolio resource assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignment = await prisma.resourceAssignment.findUnique({
      where: { id: params.assignmentId },
      include: {
        product: { select: { portfolioId: true } },
        user: { select: { costRate: true } },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.product.portfolioId !== params.id) {
      return NextResponse.json({ error: 'Assignment does not belong to this portfolio' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.utilisation !== undefined) {
      if (body.utilisation < 0 || body.utilisation > 200) {
        return NextResponse.json({ error: 'Utilisation must be between 0 and 200' }, { status: 400 })
      }
      updateData.utilisation = body.utilisation
      if (assignment.user.costRate) {
        updateData.monthlyRateCached = Number(assignment.user.costRate) * (body.utilisation / 100)
      }
    }

    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate)
    }
    if (body.endDate !== undefined) {
      updateData.endDate = new Date(body.endDate)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.resourceAssignment.update({
      where: { id: params.assignmentId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        product: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update portfolio resource assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
