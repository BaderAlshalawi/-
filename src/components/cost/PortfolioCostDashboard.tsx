'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CostSummaryCard, type CostSummaryData } from './CostSummaryCard'
import { CostBreakdownChart, type CostBreakdownItem } from './CostBreakdownChart'
import { BudgetVsActualChart } from './BudgetVsActualChart'
import { CostEntryForm } from './CostEntryForm'
import { EntityType } from '@prisma/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PortfolioCostDashboardProps {
  entityType: EntityType
  entityId: string
  entityName?: string
  canEdit?: boolean
}

async function fetchSummary(
  entityType: string,
  entityId: string
): Promise<CostSummaryData> {
  const res = await fetch(
    `/api/costs/${entityType}/${entityId}/summary`,
    { credentials: 'include' }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to load cost summary')
  }
  return res.json()
}

async function fetchBreakdown(
  entityType: string,
  entityId: string
): Promise<{ total: number; byCategory: CostBreakdownItem[] }> {
  const res = await fetch(
    `/api/costs/${entityType}/${entityId}/breakdown`,
    { credentials: 'include' }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to load cost breakdown')
  }
  const data = await res.json()
  return { total: data.total, byCategory: data.byCategory }
}

export function PortfolioCostDashboard({
  entityType,
  entityId,
  entityName,
  canEdit = true,
}: PortfolioCostDashboardProps) {
  const [showEntryForm, setShowEntryForm] = useState(false)

  const summaryQuery = useQuery({
    queryKey: ['cost-summary', entityType, entityId],
    queryFn: () => fetchSummary(entityType, entityId),
  })

  const breakdownQuery = useQuery({
    queryKey: ['cost-breakdown', entityType, entityId],
    queryFn: () => fetchBreakdown(entityType, entityId),
  })

  const summary = summaryQuery.data
  const breakdown = breakdownQuery.data
  const loading = summaryQuery.isLoading || breakdownQuery.isLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {entityName ? `${entityName} – Cost` : 'Cost'}
        </h2>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEntryForm((v) => !v)}
          >
            {showEntryForm ? 'Hide form' : 'Add cost entry'}
          </Button>
        )}
      </div>

      {showEntryForm && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>New cost entry</CardTitle>
          </CardHeader>
          <CardContent>
            <CostEntryForm
              entityType={entityType}
              entityId={entityId}
              onSuccess={() => {
                summaryQuery.refetch()
                breakdownQuery.refetch()
                setShowEntryForm(false)
              }}
              onCancel={() => setShowEntryForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <CostSummaryCard
          data={summary ?? null}
          title="Cost summary"
          loading={summaryQuery.isLoading}
        />
        <Card>
          <CardHeader>
            <CardTitle>Budget vs actual</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetVsActualChart
              estimated={summary?.estimated ?? null}
              actual={summary?.actual ?? 0}
              currency={summary?.currency ?? 'USD'}
              loading={summaryQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost by category</CardTitle>
        </CardHeader>
        <CardContent>
          <CostBreakdownChart
            breakdown={breakdown?.byCategory ?? []}
            total={breakdown?.total ?? 0}
            currency={summary?.currency ?? 'USD'}
            loading={breakdownQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
