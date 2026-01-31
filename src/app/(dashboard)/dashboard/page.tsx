'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { LineChart } from '@/components/charts/LineChart'
import { DoughnutChart } from '@/components/charts/DoughnutChart'
import { BarChart } from '@/components/charts/BarChart'

type TimePeriod = 'year' | 'month' | 'week'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [timeView, setTimeView] = useState<TimePeriod>('year')
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [selectedWeek, setSelectedWeek] = useState(1)

  useEffect(() => {
    // Fetch user if not in store
    if (!user) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            useAuthStore.getState().setUser(data.user)
          } else {
            router.push('/login')
          }
        })
        .catch(() => router.push('/login'))
    }
  }, [user, router])

  // Mock data for demonstration (replace with real API data later)
  const mockMetrics = {
    year: { revenue: 2100000, cost: 1750000, profit: 350000, products: 8, portfolios: 4 },
    month: { revenue: 175000, cost: 145833, profit: 29167, products: 8, portfolios: 4 },
    week: { revenue: 40385, cost: 33654, profit: 6731, products: 8, portfolios: 4 },
  }

  const targets = {
    year: { revenue: 2500000, cost: 1800000, profit: 700000 },
    month: { revenue: 208333, cost: 150000, profit: 58333 },
    week: { revenue: 48077, cost: 34615, profit: 13462 },
  }

  const currentMetrics = mockMetrics[timeView]
  const currentTarget = targets[timeView]

  const revenueProgress = (currentMetrics.revenue / currentTarget.revenue) * 100
  const costProgress = (currentMetrics.cost / currentTarget.cost) * 100
  const profitProgress = (currentMetrics.profit / currentTarget.profit) * 100

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)

  // Mock chart data
  const chartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    revenue: [150000, 185000, 210000, 195000, 230000, 250000],
    cost: [120000, 135000, 145000, 155000, 160000, 170000]
  }), [])

  const costBreakdownData = useMemo(() => ({
    labels: ['Resources', 'CAPEX', 'OPEX'],
    values: [currentMetrics.cost * 0.5, currentMetrics.cost * 0.3, currentMetrics.cost * 0.2]
  }), [currentMetrics.cost])

  const portfolioRevenueData = useMemo(() => ({
    labels: ['Licensing', 'Track & Trace', 'Practitioner Services', 'Insurance Services'],
    values: [850000, 620000, 380000, 250000]
  }), [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Business Efficiency Department</h1>
        <p className="text-blue-100 text-lg">Streamline operations and maximize efficiency</p>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">View Period:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeView('year')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeView === 'year'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setTimeView('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeView === 'month'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeView('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeView === 'week'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            {timeView === 'year' && (
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            )}

            {timeView === 'month' && (
              <>
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </>
            )}

            {timeView === 'week' && (
              <>
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Week:</label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[...Array(52)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        Week {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex-grow"></div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Current Period:</div>
              <div className="text-lg font-bold text-gray-900">
                {timeView === 'year' && selectedYear}
                {timeView === 'month' && `${months[selectedMonth - 1]} ${selectedYear}`}
                {timeView === 'week' && `Week ${selectedWeek}, ${selectedYear}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Revenue Card */}
        <Card className="border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-2xl">💰</div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(currentMetrics.revenue)}
            </div>
            <div className="text-xs text-gray-500 mb-3">Expected from features</div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Target ({timeView}):</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(currentTarget.revenue)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${
                    revenueProgress >= 100
                      ? 'bg-green-500'
                      : revenueProgress >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span
                  className={`font-semibold ${
                    revenueProgress >= 100
                      ? 'text-green-600'
                      : revenueProgress >= 75
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {revenueProgress.toFixed(1)}% of target
                </span>
                <span className="text-gray-500">
                  {revenueProgress >= 100 ? '+' : ''}
                  {formatCurrency(currentMetrics.revenue - currentTarget.revenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost Card */}
        <Card className="border-l-4 border-red-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 font-medium">Total Cost</div>
              <div className="text-2xl">💸</div>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {formatCurrency(currentMetrics.cost)}
            </div>
            <div className="text-xs text-gray-500 mb-3">Resources + CAPEX + OPEX</div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Budget ({timeView}):</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(currentTarget.cost)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${
                    costProgress <= 100
                      ? 'bg-green-500'
                      : costProgress <= 110
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(costProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span
                  className={`font-semibold ${
                    costProgress <= 100
                      ? 'text-green-600'
                      : costProgress <= 110
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {costProgress.toFixed(1)}% of budget
                </span>
                <span
                  className={`${
                    currentMetrics.cost <= currentTarget.cost ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {currentMetrics.cost <= currentTarget.cost ? '' : '+'}
                  {formatCurrency(currentMetrics.cost - currentTarget.cost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card className="border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 font-medium">Net Profit</div>
              <div className="text-2xl">✅</div>
            </div>
            <div
              className={`text-3xl font-bold mb-1 ${
                currentMetrics.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {currentMetrics.profit >= 0 ? '' : '-'}
              {formatCurrency(Math.abs(currentMetrics.profit))}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Margin: {((currentMetrics.profit / currentMetrics.revenue) * 100).toFixed(1)}%
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Target ({timeView}):</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(currentTarget.profit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${
                    profitProgress >= 100
                      ? 'bg-green-500'
                      : profitProgress >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(profitProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span
                  className={`font-semibold ${
                    profitProgress >= 100
                      ? 'text-green-600'
                      : profitProgress >= 75
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {profitProgress.toFixed(1)}% of target
                </span>
                <span
                  className={`${
                    currentMetrics.profit >= currentTarget.profit ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {currentMetrics.profit >= currentTarget.profit ? '+' : ''}
                  {formatCurrency(currentMetrics.profit - currentTarget.profit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target vs Achieved Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-l-4 border-yellow-400 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium opacity-90">Target vs Achieved</div>
              <div className="text-2xl">🎯</div>
            </div>

            <div className="mb-4">
              <div className="text-xs opacity-80 mb-1">Revenue</div>
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <div className="text-sm opacity-75">Target</div>
                  <div className="text-xl font-bold">{formatCurrency(currentTarget.revenue)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-75">Achieved</div>
                  <div className="text-xl font-bold">{formatCurrency(currentMetrics.revenue)}</div>
                </div>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    revenueProgress >= 100 ? 'bg-yellow-300' : 'bg-white bg-opacity-60'
                  }`}
                  style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-3 border-t border-white border-opacity-20">
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-80">Achievement Rate</div>
                <div
                  className={`text-2xl font-bold ${
                    revenueProgress >= 100 ? 'text-yellow-300' : 'text-white'
                  }`}
                >
                  {revenueProgress.toFixed(0)}%
                </div>
              </div>
              {revenueProgress >= 100 ? (
                <div className="mt-2 text-xs bg-yellow-300 text-indigo-900 px-2 py-1 rounded font-semibold text-center">
                  ✓ Target Achieved!
                </div>
              ) : (
                <div className="mt-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-center">
                  {formatCurrency(currentTarget.revenue - currentMetrics.revenue)} to go
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 font-medium">Products</div>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {currentMetrics.products}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Across {currentMetrics.portfolios} portfolios
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Performance Status:</div>
              <div className="flex flex-wrap gap-1">
                {revenueProgress >= 100 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    Revenue ✓
                  </span>
                )}
                {costProgress <= 100 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    Budget ✓
                  </span>
                )}
                {profitProgress >= 100 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    Profit ✓
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Cost Trend</CardTitle>
            <CardDescription>Monthly performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChart data={chartData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>Resources, CAPEX, and OPEX breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <DoughnutChart data={costBreakdownData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Revenue Comparison</CardTitle>
          <CardDescription>Revenue distribution across portfolios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <BarChart data={portfolioRevenueData} />
          </div>
        </CardContent>
      </Card>

      {/* Action Required Section */}
      <Card>
        <CardHeader>
          <CardTitle>Action Required</CardTitle>
          <CardDescription>Items requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No pending actions</p>
        </CardContent>
      </Card>
    </div>
  )
}
