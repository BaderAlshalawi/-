'use client'

import { DoughnutChart } from '@/components/charts/DoughnutChart'

export interface CostBreakdownItem {
  category: string
  amount: number
  percentage: number
}

interface CostBreakdownChartProps {
  breakdown: CostBreakdownItem[]
  total: number
  currency?: string
  loading?: boolean
}

const CATEGORY_COLORS = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(239, 68, 68, 0.8)',
]

export function CostBreakdownChart({
  breakdown,
  total,
  currency = 'USD',
  loading = false,
}: CostBreakdownChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center rounded-lg border bg-muted/30">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }

  if (!breakdown.length || total === 0) {
    return (
      <div className="h-64 flex items-center justify-center rounded-lg border bg-muted/30">
        <span className="text-muted-foreground text-sm">
          No cost breakdown data.
        </span>
      </div>
    )
  }

  const labels = breakdown.map(
    (b) => `${b.category} (${b.percentage.toFixed(1)}%)`
  )
  const values = breakdown.map((b) => b.amount)

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Total:{' '}
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
        }).format(total)}
      </div>
      <div className="h-64">
        <DoughnutChart
          data={{
            labels,
            values,
          }}
        />
      </div>
    </div>
  )
}
