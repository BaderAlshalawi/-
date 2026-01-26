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

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = await canPerform(user, 'portfolio:lock', {
      portfolioId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update portfolio
    const updated = await prisma.portfolio.update({
      where: { id: params.id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.LOCK,
      entityType: EntityType.PORTFOLIO,
      entityId: portfolio.id,
      entityName: portfolio.name,
      comment: 'Portfolio locked',
    })

    return NextResponse.json({ portfolio: updated })
  } catch (error) {
    console.error('Lock portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
