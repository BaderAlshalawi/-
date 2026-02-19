import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'resource:delete-assignment')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignment = await prisma.resourceAssignment.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Resource assignment not found' }, { status: 404 })
    }

    await prisma.resourceAssignment.delete({ where: { id: params.id } })

    await createAuditLog({
      actor: user,
      action: AuditAction.DELETE,
      entityType: EntityType.RESOURCE_ASSIGNMENT,
      entityId: assignment.id,
      entityName: `${assignment.user.name} → ${assignment.product.name}`,
      comment: 'Resource assignment deleted',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete resource assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
