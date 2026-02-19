import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSystemConfig } from '@/lib/system'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slaConfig = await getSystemConfig('approval_sla_days')
    const slaDays = (slaConfig?.value as { days?: number })?.days || 5

    const now = new Date()
    const pendingActions: any[] = []

    if (user.role === 'SUPER_ADMIN') {
      const pendingPortfolios = await prisma.portfolio.findMany({
        where: { governanceState: 'SUBMITTED' },
        select: {
          id: true, name: true, code: true, submittedAt: true,
          submittedBy: { select: { name: true, email: true } },
        },
        orderBy: { submittedAt: 'asc' },
      })

      pendingPortfolios.forEach((p) => {
        const overdue = isOverdue(p.submittedAt, slaDays, now)
        pendingActions.push({
          type: 'PORTFOLIO_APPROVAL',
          entityType: 'PORTFOLIO',
          entityId: p.id,
          entityName: p.name,
          entityCode: p.code,
          submittedAt: p.submittedAt,
          submittedBy: p.submittedBy,
          isOverdue: overdue,
          action: 'Approve or Reject',
          href: `/portfolios/${p.id}`,
        })
      })
    }

    if (user.role === 'PROGRAM_MANAGER' && user.assignedPortfolioId) {
      const pendingProducts = await prisma.product.findMany({
        where: {
          governanceState: 'SUBMITTED',
          portfolioId: user.assignedPortfolioId,
        },
        select: {
          id: true, name: true, code: true, submittedAt: true,
          submittedBy: { select: { name: true, email: true } },
        },
        orderBy: { submittedAt: 'asc' },
      })

      pendingProducts.forEach((p) => {
        const overdue = isOverdue(p.submittedAt, slaDays, now)
        pendingActions.push({
          type: 'PRODUCT_APPROVAL',
          entityType: 'PRODUCT',
          entityId: p.id,
          entityName: p.name,
          entityCode: p.code,
          submittedAt: p.submittedAt,
          submittedBy: p.submittedBy,
          isOverdue: overdue,
          action: 'Approve or Reject',
          href: `/products/${p.id}`,
        })
      })

      const pendingGoNogo = await prisma.release.findMany({
        where: {
          goNogoSubmitted: true,
          goNogoDecision: null,
          product: { portfolioId: user.assignedPortfolioId },
        },
        select: {
          id: true, name: true, version: true, goNogoSubmittedAt: true,
          goNogoSubmittedBy: { select: { name: true, email: true } },
          product: { select: { name: true } },
        },
        orderBy: { goNogoSubmittedAt: 'asc' },
      })

      pendingGoNogo.forEach((r) => {
        const overdue = isOverdue(r.goNogoSubmittedAt, slaDays, now)
        pendingActions.push({
          type: 'GO_NOGO_DECISION',
          entityType: 'RELEASE',
          entityId: r.id,
          entityName: `${r.product.name} - ${r.name} (${r.version})`,
          submittedAt: r.goNogoSubmittedAt,
          submittedBy: r.goNogoSubmittedBy,
          isOverdue: overdue,
          action: 'Record Go/No-Go Decision',
          href: `/releases/${r.id}`,
        })
      })
    }

    return NextResponse.json({
      pendingActions,
      totalPending: pendingActions.length,
      totalOverdue: pendingActions.filter((a) => a.isOverdue).length,
      slaDays,
    })
  } catch (error) {
    console.error('Pending actions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function isOverdue(submittedAt: Date | null, slaDays: number, now: Date): boolean {
  if (!submittedAt) return false
  let businessDays = 0
  const d = new Date(submittedAt)
  while (d < now) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) businessDays++
  }
  return businessDays > slaDays
}
