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

    const hasPermission = await canPerform(user, 'user:edit', {})
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'User is already active' },
        { status: 400 }
      )
    }

    // Reactivate user
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { status: 'ACTIVE' },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.REACTIVATE,
      entityType: EntityType.USER,
      entityId: targetUser.id,
      entityName: targetUser.email,
      comment: 'User reactivated',
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Reactivate user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
