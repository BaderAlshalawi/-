import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
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

    const { decision, notes } = await request.json()

    if (!decision || !['GO', 'NO_GO'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be either GO or NO_GO' },
        { status: 400 }
      )
    }

    const release = await prisma.release.findUnique({
      where: { id: params.id },
    })

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    if (!release.goNogoSubmitted) {
      return NextResponse.json(
        { error: 'Release must be submitted for Go/No-Go first' },
        { status: 400 }
      )
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
        goNogoDecision: decision,
        goNogoDecidedAt: new Date(),
        goNogoDecidedById: user.id,
        goNogoNotes: notes || null,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.RELEASE,
      entityId: release.id,
      entityName: release.name,
      changedFields: {
        goNogoDecision: { old: release.goNogoDecision, new: decision },
      },
      comment: `Go/No-Go decision: ${decision}${notes ? ` - ${notes}` : ''}`,
    })

    return NextResponse.json({ release: updated })
  } catch (error) {
    console.error('Decide Go/No-Go error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
