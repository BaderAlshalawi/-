'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BudgetVsActualChartProps {
  estimated: number | null
  actual: number
  currency?: string
  loading?: boolean
}

export function BudgetVsActualChart({
  estimated,
  actual,
  currency = 'SAR',
  loading = false,
}: BudgetVsActualChartProps) {
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center rounded-lg border bg-muted/30">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }

  const hasEstimated = estimated != null && estimated > 0
  const labels = hasEstimated
    ? ['Estimated (Budget)', 'Actual']
    : ['Actual']
  const values = hasEstimated ? [estimated, actual] : [actual]
  const colors = hasEstimated
    ? ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)']
    : ['rgba(34, 197, 94, 0.8)']

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Amount',
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number | null } }) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency,
              minimumFractionDigits: 0,
            }).format(context.parsed.y ?? 0),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency,
                  minimumFractionDigits: 0,
                  notation: 'compact',
                }).format(value)
              : value,
        },
      },
    },
  }

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  )
}
