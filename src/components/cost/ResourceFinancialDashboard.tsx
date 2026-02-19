'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { DollarSign, TrendingUp, TrendingDown, Users, Server } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface FinancialSummary {
  laborCostTotal: number
  hostingCostTotal: number
  portfolioTotalCost: number
  estimatedBudget: number | null
  variance: number | null
  currency: string
  breakdowns?: {
    byPhase: Record<string, number>
    byTeamType: Record<string, number>
    byFeature: Record<string, number>
    byQuarter: Record<string, number>
    byGradeRole: Record<string, number>
    hostingByCategory: Record<string, number>
  }
}

const fmt = (n: number) => Number(n).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const CHART_COLORS = [
  'rgba(124, 58, 237, 0.85)',
  'rgba(27, 54, 93, 0.85)',
  'rgba(34, 197, 94, 0.85)',
  'rgba(239, 68, 68, 0.85)',
  'rgba(245, 158, 11, 0.85)',
  'rgba(59, 130, 246, 0.85)',
  'rgba(236, 72, 153, 0.85)',
  'rgba(107, 114, 128, 0.85)',
  'rgba(16, 185, 129, 0.85)',
  'rgba(139, 92, 246, 0.85)',
]

function buildChartData(data: Record<string, number>, label: string) {
  const labels = Object.keys(data)
  const values = Object.values(data)
  if (labels.length === 0) return null
  return {
    labels,
    datasets: [{
      label,
      data: values,
      backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 0,
    }],
  }
}

export function ResourceFinancialDashboard({ portfolioId }: { portfolioId: string }) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/financial-summary?breakdowns=true`)
      const data = await res.json()
      setSummary(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [portfolioId])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading financial data...</div>
  }

  if (!summary) return null

  const isOverBudget = summary.variance != null && summary.variance < 0
  const bd = summary.breakdowns

  const overallData = {
    labels: ['Labor', 'Hosting'],
    datasets: [{
      data: [summary.laborCostTotal, summary.hostingCostTotal],
      backgroundColor: ['rgba(124, 58, 237, 0.85)', 'rgba(27, 54, 93, 0.85)'],
      borderWidth: 0,
    }],
  }

  const phaseChart = bd ? buildChartData(bd.byPhase, 'Cost by Phase') : null
  const teamChart = bd ? buildChartData(bd.byTeamType, 'Cost by Team Type') : null
  const featureChart = bd ? buildChartData(bd.byFeature, 'Cost by Feature') : null
  const quarterChart = bd ? buildChartData(bd.byQuarter, 'Cost by Quarter') : null

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 10, usePointStyle: true, font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(27, 54, 93, 0.95)', padding: 8, cornerRadius: 6 },
    },
  }

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(27, 54, 93, 0.95)', padding: 8, cornerRadius: 6 },
    },
    scales: { y: { beginAtZero: true } },
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Labor Cost</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{fmt(summary.laborCostTotal)} SAR</p>
              </div>
              <Users className="h-6 w-6 text-purple-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#1B365D] shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hosting Cost</p>
                <p className="text-2xl font-bold text-[#1B365D] mt-1">{fmt(summary.hostingCostTotal)} SAR</p>
              </div>
              <Server className="h-6 w-6 text-[#1B365D]/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{fmt(summary.portfolioTotalCost)} SAR</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 shadow-sm ${
          summary.variance == null ? 'border-l-gray-300' : isOverBudget ? 'border-l-red-500' : 'border-l-green-500'
        }`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variance</p>
                {summary.variance != null ? (
                  <p className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget ? '-' : '+'}{fmt(Math.abs(summary.variance))} SAR
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground mt-1">—</p>
                )}
              </div>
              {summary.variance != null && (
                isOverBudget
                  ? <TrendingDown className="h-6 w-6 text-red-400/60" />
                  : <TrendingUp className="h-6 w-6 text-green-400/60" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Overall + Phase */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Labor vs Hosting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {summary.portfolioTotalCost > 0 ? (
                <Doughnut data={overallData} options={doughnutOpts} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No cost data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {phaseChart && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Labor by Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <Bar data={phaseChart} options={barOpts} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 2: Team Type + Feature */}
      <div className="grid gap-4 md:grid-cols-2">
        {teamChart && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Labor by Team Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <Doughnut data={teamChart} options={doughnutOpts} />
              </div>
            </CardContent>
          </Card>
        )}

        {featureChart && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Labor by Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <Bar data={featureChart} options={barOpts} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 3: Quarter */}
      {quarterChart && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Labor by Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <Bar data={quarterChart} options={barOpts} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
