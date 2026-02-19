import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      portfoliosByState,
      totalProducts,
      activeReleases,
      featuresInProgress,
      portfolioFinancials,
      costByCategory,
      costTrend,
      portfolioComparison,
    ] = await Promise.all([
      prisma.portfolio.groupBy({
        by: ['governanceState'],
        _count: { id: true },
      }),
      prisma.product.count(),
      prisma.release.count({
        where: { isLocked: false, governanceState: { not: 'ARCHIVED' } },
      }),
      prisma.feature.count({ where: { state: 'IN_PROGRESS' } }),
      prisma.portfolio.aggregate({
        _sum: { estimatedBudget: true, actualCost: true },
      }),
      prisma.costEntry.groupBy({
        by: ['category'],
        _sum: { amount: true },
      }),
      prisma.costEntry.findMany({
        select: { amount: true, date: true },
        orderBy: { date: 'asc' },
      }),
      prisma.portfolio.findMany({
        where: { governanceState: { not: 'ARCHIVED' } },
        select: {
          id: true,
          name: true,
          estimatedBudget: true,
          actualCost: true,
        },
      }),
    ])

    const stateBreakdown: Record<string, number> = {}
    let totalPortfolios = 0
    portfoliosByState.forEach((g) => {
      stateBreakdown[g.governanceState] = g._count.id
      totalPortfolios += g._count.id
    })

    const totalBudget = Number(portfolioFinancials._sum.estimatedBudget || 0)
    const totalActualCost = Number(portfolioFinancials._sum.actualCost || 0)
    const variance = totalActualCost - totalBudget
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0

    const monthlyTrend: Record<string, number> = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTrend[key] = 0
    }
    costTrend.forEach((entry) => {
      const d = new Date(entry.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthlyTrend) {
        monthlyTrend[key] += Number(entry.amount)
      }
    })

    const categoryBreakdown = costByCategory.map((c) => ({
      category: c.category,
      total: Number(c._sum.amount || 0),
    }))

    const portfolioComparisonData = portfolioComparison.map((p) => ({
      id: p.id,
      name: p.name,
      estimatedBudget: Number(p.estimatedBudget || 0),
      actualCost: Number(p.actualCost || 0),
    }))

    return NextResponse.json({
      kpis: {
        totalPortfolios,
        stateBreakdown,
        totalProducts,
        activeReleases,
        featuresInProgress,
        totalBudget,
        totalActualCost,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
      },
      costTrend: Object.entries(monthlyTrend).map(([month, total]) => ({
        month,
        total,
      })),
      categoryBreakdown,
      portfolioComparison: portfolioComparisonData,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
