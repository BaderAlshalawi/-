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

    if (!release.isLocked) {
      return NextResponse.json(
        { error: 'Post-release notes can only be added to locked releases' },
        { status: 409 }
      )
    }

    const { notes } = await request.json()

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 })
    }

    const updated = await prisma.release.update({
      where: { id: params.id },
      data: { postReleaseNotes: notes.trim() },
    })

    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.RELEASE,
      entityId: release.id,
      entityName: release.name,
      changedFields: {
        postReleaseNotes: { old: release.postReleaseNotes, new: notes.trim() },
      },
      comment: 'Post-release notes updated',
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update post-release notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
