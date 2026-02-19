'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { LineChart } from '@/components/charts/LineChart'
import { DoughnutChart } from '@/components/charts/DoughnutChart'
import { BarChart } from '@/components/charts/BarChart'
import Link from 'next/link'
import {
  FolderKanban, Package, Rocket, Zap, DollarSign, TrendingUp,
  AlertCircle, Clock, ChevronRight,
} from 'lucide-react'

interface DashboardData {
  kpis: {
    totalPortfolios: number
    stateBreakdown: Record<string, number>
    totalProducts: number
    activeReleases: number
    featuresInProgress: number
    totalBudget: number
    totalActualCost: number
    variance: number
    variancePercent: number
  }
  costTrend: Array<{ month: string; total: number }>
  categoryBreakdown: Array<{ category: string; total: number }>
  portfolioComparison: Array<{
    id: string; name: string; estimatedBudget: number; actualCost: number
  }>
}

interface PendingAction {
  type: string
  entityType: string
  entityId: string
  entityName: string
  entityCode?: string
  submittedAt: string
  submittedBy: { name: string; email: string } | null
  isOverdue: boolean
  action: string
  href: string
}

interface PendingActionsData {
  pendingActions: PendingAction[]
  totalPending: number
  totalOverdue: number
  slaDays: number
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState<DashboardData | null>(null)
  const [pendingData, setPendingData] = useState<PendingActionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((d) => {
          if (d.user) useAuthStore.getState().setUser(d.user)
          else router.push('/login')
        })
        .catch(() => router.push('/login'))
    }
  }, [user, router])

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, pendingRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/pending-actions'),
      ])
      if (dashRes.ok) setData(await dashRes.json())
      if (pendingRes.ok) setPendingData(await pendingRes.json())
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchDashboard()
  }, [user, fetchDashboard])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(val)

  const getVarianceColor = (pct: number) => {
    if (pct <= 0) return 'text-green-600'
    if (pct <= 10) return 'text-amber-600'
    return 'text-red-600'
  }

  const getVarianceBg = (pct: number) => {
    if (pct <= 0) return 'bg-green-500'
    if (pct <= 10) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  const kpis = data?.kpis

  const chartData = data ? {
    labels: data.costTrend.map((t) => {
      const [y, m] = t.month.split('-')
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en', { month: 'short' })
    }),
    revenue: data.costTrend.map(() => 0),
    cost: data.costTrend.map((t) => t.total),
  } : { labels: [], revenue: [], cost: [] }

  const costBreakdownData = data ? {
    labels: data.categoryBreakdown.map((c) => c.category.replace('_', ' ')),
    values: data.categoryBreakdown.map((c) => c.total),
  } : { labels: [], values: [] }

  const portfolioCompData = data ? {
    labels: data.portfolioComparison.map((p) => p.name),
    values: data.portfolioComparison.map((p) => p.estimatedBudget),
    actualValues: data.portfolioComparison.map((p) => p.actualCost),
  } : { labels: [], values: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B365D] to-[#7C3AED] rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">LeanPulse Dashboard</h1>
        <p className="text-white/80 text-lg">Portfolio governance and financial oversight at a glance</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground font-medium">Total Portfolios</div>
                <FolderKanban className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{kpis.totalPortfolios}</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(kpis.stateBreakdown).map(([state, count]) => (
                  <Badge key={state} variant="outline" className="text-xs">
                    {state}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground font-medium">Total Products</div>
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-purple-600">{kpis.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground font-medium">Active Releases</div>
                <Rocket className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-600">{kpis.activeReleases}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground font-medium">Features In Progress</div>
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600">{kpis.featuresInProgress}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground font-medium">Budget Variance</div>
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
              <div className={`text-2xl font-bold ${getVarianceColor(kpis.variancePercent)}`}>
                {kpis.variancePercent > 0 ? '+' : ''}{kpis.variancePercent}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(kpis.totalActualCost)} / {formatCurrency(kpis.totalBudget)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${getVarianceBg(kpis.variancePercent)}`}
                  style={{ width: `${Math.min(kpis.totalBudget > 0 ? (kpis.totalActualCost / kpis.totalBudget) * 100 : 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Overview Cards */}
      {kpis && (user.role === 'SUPER_ADMIN' || user.role === 'PROGRAM_MANAGER') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Total Budget</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalBudget)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Actual Cost</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalActualCost)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`h-4 w-4 ${getVarianceColor(kpis.variancePercent)}`} />
                <span className="text-sm text-muted-foreground">Variance</span>
              </div>
              <div className={`text-2xl font-bold ${getVarianceColor(kpis.variancePercent)}`}>
                {formatCurrency(kpis.variance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {data && (user.role === 'SUPER_ADMIN' || user.role === 'PROGRAM_MANAGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trend (12 Months)</CardTitle>
              <CardDescription>Monthly actual cost across all portfolios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <LineChart data={chartData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
              <CardDescription>Total actual cost breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {costBreakdownData.values.length > 0 ? (
                  <DoughnutChart data={costBreakdownData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No cost data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Comparison */}
      {data && data.portfolioComparison.length > 0 && (user.role === 'SUPER_ADMIN' || user.role === 'PROGRAM_MANAGER') && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Budget vs Actual Cost</CardTitle>
            <CardDescription>Estimated budget compared to actual cost per portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChart data={portfolioCompData} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.portfolioComparison.map((p) => {
                const variance = p.actualCost - p.estimatedBudget
                const variancePct = p.estimatedBudget > 0 ? (variance / p.estimatedBudget) * 100 : 0
                return (
                  <Link key={p.id} href={`/portfolios/${p.id}`} className="block">
                    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(p.actualCost)} / {formatCurrency(p.estimatedBudget)}
                        </span>
                        <span className={`text-xs font-medium ${getVarianceColor(variancePct)}`}>
                          {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Action Required
                {pendingData && pendingData.totalPending > 0 && (
                  <Badge variant="destructive">{pendingData.totalPending}</Badge>
                )}
              </CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </div>
            {pendingData && pendingData.totalOverdue > 0 && (
              <Badge className="bg-amber-500 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {pendingData.totalOverdue} Overdue (SLA: {pendingData.slaDays} days)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingData && pendingData.pendingActions.length > 0 ? (
            <div className="space-y-2">
              {pendingData.pendingActions.map((action) => (
                <Link key={`${action.entityType}-${action.entityId}`} href={action.href}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${action.isOverdue ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {action.entityName}
                          {action.isOverdue && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">Overdue</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.action} &middot; Submitted by {action.submittedBy?.name || 'Unknown'} on{' '}
                          {action.submittedAt ? new Date(action.submittedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{action.entityType}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No pending actions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
