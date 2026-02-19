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

    const hasPermission = await canPerform(user, 'portfolio:archive', { portfolioId: params.id })
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: {
        products: {
          where: {
            governanceState: { in: ['DRAFT', 'SUBMITTED'] },
          },
        },
      },
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    if (portfolio.governanceState === 'ARCHIVED') {
      return NextResponse.json({ error: 'Portfolio is already archived' }, { status: 409 })
    }

    if (!['APPROVED', 'LOCKED'].includes(portfolio.governanceState)) {
      return NextResponse.json(
        { error: 'Only APPROVED or LOCKED portfolios can be archived' },
        { status: 409 }
      )
    }

    if (portfolio.products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot archive portfolio with active products in DRAFT or SUBMITTED state' },
        { status: 409 }
      )
    }

    const updated = await prisma.portfolio.update({
      where: { id: params.id },
      data: {
        governanceState: 'ARCHIVED',
        archivedAt: new Date(),
        archivedById: user.id,
      },
    })

    await createAuditLog({
      actor: user,
      action: AuditAction.ARCHIVE,
      entityType: EntityType.PORTFOLIO,
      entityId: portfolio.id,
      entityName: portfolio.name,
      changedFields: {
        governanceState: { old: portfolio.governanceState, new: 'ARCHIVED' },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Archive portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
