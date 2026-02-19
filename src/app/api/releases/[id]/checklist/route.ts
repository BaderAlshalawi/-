import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'release:edit', { releaseId: params.id })
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const release = await prisma.release.findUnique({
      where: { id: params.id },
    })

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    if (release.isLocked) {
      return NextResponse.json({ error: 'Release is locked' }, { status: 409 })
    }

    const { itemId, completed } = await request.json()

    if (!itemId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'itemId and completed (boolean) are required' },
        { status: 400 }
      )
    }

    const checklist = Array.isArray(release.readinessChecklist)
      ? (release.readinessChecklist as Array<{ id: string; item: string; completed: boolean }>)
      : []

    const itemIndex = checklist.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    const oldCompleted = checklist[itemIndex].completed
    checklist[itemIndex].completed = completed

    const updated = await prisma.release.update({
      where: { id: params.id },
      data: { readinessChecklist: checklist },
    })

    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.RELEASE,
      entityId: release.id,
      entityName: release.name,
      changedFields: {
        [`checklist.${itemId}.completed`]: { old: oldCompleted, new: completed },
      },
      comment: `Checklist item "${checklist[itemIndex].item}" marked as ${completed ? 'complete' : 'incomplete'}`,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
