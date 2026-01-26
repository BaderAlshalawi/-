import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const release = await prisma.release.findUnique({
      where: { id: params.id },
    })

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = await canPerform(user, 'release:submit-go-nogo', {
      releaseId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update release
    const updated = await prisma.release.update({
      where: { id: params.id },
      data: {
        goNogoSubmitted: true,
        goNogoSubmittedAt: new Date(),
        goNogoSubmittedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.SUBMIT,
      entityType: EntityType.RELEASE,
      entityId: release.id,
      entityName: release.name,
      comment: 'Release submitted for Go/No-Go decision',
    })

    return NextResponse.json({ release: updated })
  } catch (error) {
    console.error('Submit Go/No-Go error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
