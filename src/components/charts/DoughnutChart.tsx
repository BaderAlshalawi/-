'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  data: {
    labels: string[]
    values: number[]
  }
}

export function DoughnutChart({ data }: DoughnutChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(context.parsed)
            }
            return label
          },
        },
      },
    },
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
