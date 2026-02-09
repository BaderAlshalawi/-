'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface CostSummaryData {
  entityType: string
  entityId: string
  estimated: number | null
  actual: number
  currency: string
  variance: number | null
}

interface CostSummaryCardProps {
  data: CostSummaryData | null
  title?: string
  loading?: boolean
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function CostSummaryCard({
  data,
  title = 'Cost Summary',
  loading = false,
}: CostSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-2/3" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No cost data available.</p>
        </CardContent>
      </Card>
    )
  }

  const { estimated, actual, currency, variance } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground text-sm">Actual cost</span>
          <span className="text-xl font-semibold">
            {formatMoney(actual, currency)}
          </span>
        </div>
        {estimated != null && (
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-sm">Estimated</span>
            <span className="text-sm">{formatMoney(estimated, currency)}</span>
          </div>
        )}
        {variance != null && (
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-sm">Variance</span>
            <span
              className={
                variance > 0
                  ? 'text-destructive text-sm'
                  : variance < 0
                    ? 'text-green-600 text-sm'
                    : 'text-muted-foreground text-sm'
              }
            >
              {variance > 0 ? '+' : ''}
              {formatMoney(variance, currency)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
