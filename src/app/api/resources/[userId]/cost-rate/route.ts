import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'resource:manage')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, costRate: true, costRateCurrency: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { amount, currency } = await request.json()

    if (amount === undefined || amount === null || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Valid cost rate amount is required' }, { status: 400 })
    }

    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
      return NextResponse.json({ error: 'Valid 3-letter currency code is required' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: {
        costRate: amount,
        costRateCurrency: currency.toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        costRate: true,
        costRateCurrency: true,
      },
    })

    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.RESOURCE,
      entityId: targetUser.id,
      entityName: targetUser.name,
      changedFields: {
        costRate: { old: Number(targetUser.costRate), new: amount },
        costRateCurrency: { old: targetUser.costRateCurrency, new: currency.toUpperCase() },
      },
      comment: 'Resource cost rate updated',
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update cost rate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
