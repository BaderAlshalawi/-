import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, GovernanceState } from '@/types'

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
    const hasPermission = await canPerform(user, 'portfolio:submit', {
      portfolioId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate state — allow resubmission after rejection
    if (portfolio.governanceState !== GovernanceState.DRAFT && portfolio.governanceState !== GovernanceState.REJECTED) {
      return NextResponse.json(
        { error: 'Portfolio must be in DRAFT or REJECTED state to submit' },
        { status: 400 }
      )
    }

    // Update portfolio
    const updated = await prisma.portfolio.update({
      where: { id: params.id },
      data: {
        governanceState: GovernanceState.SUBMITTED,
        submittedAt: new Date(),
        submittedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.SUBMIT,
      entityType: EntityType.PORTFOLIO,
      entityId: portfolio.id,
      entityName: portfolio.name,
      comment: 'Portfolio roadmap submitted',
    })

    return NextResponse.json({ portfolio: updated })
  } catch (error) {
    console.error('Submit portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
