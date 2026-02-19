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

    const { searchParams } = new URL(request.url)
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
    const priority = searchParams.get('priority') || ''
    const managerId = searchParams.get('managerId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: any = {}
    if (statuses.length > 0) {
      where.governanceState = { in: statuses }
    }
    if (priority) {
      where.priority = priority
    }
    if (managerId) {
      where.programManagerId = managerId
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    // Portfolios by status
    const statusCounts = await prisma.portfolio.groupBy({
      by: ['governanceState'],
      _count: { id: true },
      where,
    })

    // Portfolios by priority
    const priorityCounts = await prisma.portfolio.groupBy({
      by: ['priority'],
      _count: { id: true },
      where,
    })

    // Products count per portfolio (top 10)
    const portfoliosWithProductCount = await prisma.portfolio.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { products: true } },
      },
      orderBy: { products: { _count: 'desc' } },
      take: 10,
    })

    // Financial aggregates
    const financials = await prisma.portfolio.aggregate({
      where,
      _sum: {
        estimatedBudget: true,
        actualCost: true,
      },
      _count: { id: true },
    })

    // Program managers list (for filter dropdown)
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['PROGRAM_MANAGER', 'SUPER_ADMIN'] },
        status: 'ACTIVE',
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      byStatus: statusCounts.map((s) => ({
        status: s.governanceState,
        count: s._count.id,
      })),
      byPriority: priorityCounts.map((p) => ({
        priority: p.priority || 'NONE',
        count: p._count.id,
      })),
      productDistribution: portfoliosWithProductCount.map((p) => ({
        name: p.name,
        code: p.code,
        productCount: p._count.products,
      })),
      financials: {
        totalEstimatedBudget: financials._sum.estimatedBudget
          ? Number(financials._sum.estimatedBudget)
          : 0,
        totalActualCost: financials._sum.actualCost
          ? Number(financials._sum.actualCost)
          : 0,
        totalPortfolios: financials._count.id,
      },
      managers,
    })
  } catch (error) {
    console.error('Portfolio analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
