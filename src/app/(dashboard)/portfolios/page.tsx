'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import Link from 'next/link'
import { Portfolio } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import {
  FolderKanban, ArrowRight, Briefcase, CheckCircle2, Package,
  Plus, Pencil, Trash2, Lock, Unlock, X, TrendingUp,
  DollarSign, BarChart3, Calendar, Users, AlertTriangle
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface Analytics {
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  productDistribution: { name: string; code: string; productCount: number }[]
  financials: { totalEstimatedBudget: number; totalActualCost: number; totalPortfolios: number }
  managers: { id: string; name: string; email: string }[]
}

interface Filters {
  statuses: string[]
  priority: string
  managerId: string
  dateFrom: string
  dateTo: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'rgba(156, 163, 175, 0.85)',
  SUBMITTED: 'rgba(139, 92, 246, 0.85)',
  APPROVED: 'rgba(34, 197, 94, 0.85)',
  REJECTED: 'rgba(239, 68, 68, 0.85)',
  LOCKED: 'rgba(27, 54, 93, 0.85)',
  ARCHIVED: 'rgba(107, 114, 128, 0.85)',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'rgba(34, 197, 94, 0.85)',
  MEDIUM: 'rgba(245, 158, 11, 0.85)',
  HIGH: 'rgba(239, 68, 68, 0.85)',
  CRITICAL: 'rgba(127, 29, 29, 0.85)',
  NONE: 'rgba(156, 163, 175, 0.85)',
}

const ALL_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED', 'ARCHIVED']

function formatBudget(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString()
}

export default function PortfoliosPage() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    statuses: [], priority: '', managerId: '', dateFrom: '', dateTo: '',
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', priority: 'MEDIUM',
    programManagerId: '', estimatedBudget: '',
  })
  const [saving, setSaving] = useState(false)

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','))
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.managerId) params.set('managerId', filters.managerId)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    return params.toString()
  }, [filters])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const qs = buildFilterParams()
    try {
      const [portfolioRes, analyticsRes] = await Promise.all([
        fetch('/api/portfolios'),
        fetch(`/api/portfolios/analytics?${qs}`),
      ])
      const portfolioData = await portfolioRes.json()
      const analyticsData = await analyticsRes.json()
      let allPortfolios: Portfolio[] = portfolioData.portfolios || []
      if (filters.statuses.length > 0) {
        allPortfolios = allPortfolios.filter((p) => filters.statuses.includes(p.governanceState))
      }
      if (filters.priority) {
        allPortfolios = allPortfolios.filter((p) => p.priority === filters.priority)
      }
      if (filters.managerId) {
        allPortfolios = allPortfolios.filter((p) => p.programManagerId === filters.managerId)
      }
      setPortfolios(allPortfolios)
      setAnalytics(analyticsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [buildFilterParams, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const hasActiveFilters = filters.statuses.length > 0 || !!filters.priority || !!filters.managerId || !!filters.dateFrom || !!filters.dateTo

  const clearFilters = () => {
    setFilters({ statuses: [], priority: '', managerId: '', dateFrom: '', dateTo: '' })
  }

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }

  // CRUD handlers
  const openCreate = () => {
    setFormData({ name: '', code: '', description: '', priority: 'MEDIUM', programManagerId: '', estimatedBudget: '' })
    setCreateOpen(true)
  }

  const openEdit = (p: Portfolio) => {
    setSelectedPortfolio(p)
    setFormData({
      name: p.name,
      code: p.code,
      description: p.description || '',
      priority: p.priority || 'MEDIUM',
      programManagerId: p.programManagerId || '',
      estimatedBudget: p.estimatedBudget ? String(p.estimatedBudget) : '',
    })
    setEditOpen(true)
  }

  const openDelete = (p: Portfolio) => {
    setSelectedPortfolio(p)
    setDeleteOpen(true)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description || null,
          priority: formData.priority,
          estimatedBudget: formData.estimatedBudget ? Number(formData.estimatedBudget) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create portfolio')
        return
      }
      setCreateOpen(false)
      fetchData()
    } catch {
      alert('Failed to create portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedPortfolio) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portfolios/${selectedPortfolio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          priority: formData.priority,
          programManagerId: formData.programManagerId || null,
          estimatedBudget: formData.estimatedBudget ? Number(formData.estimatedBudget) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to update portfolio')
        return
      }
      setEditOpen(false)
      fetchData()
    } catch {
      alert('Failed to update portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPortfolio) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portfolios/${selectedPortfolio.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to delete portfolio')
        return
      }
      setDeleteOpen(false)
      setSelectedPortfolio(null)
      fetchData()
    } catch {
      alert('Failed to delete portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleLockToggle = async (p: Portfolio) => {
    const action = p.isLocked ? 'unlock' : 'lock'
    try {
      const res = await fetch(`/api/portfolios/${p.id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || `Failed to ${action} portfolio`)
        return
      }
      fetchData()
    } catch {
      alert(`Failed to ${action} portfolio`)
    }
  }

  // Chart data
  const statusChartData = analytics ? {
    labels: analytics.byStatus.map((s) => s.status.replace('_', ' ')),
    datasets: [{
      data: analytics.byStatus.map((s) => s.count),
      backgroundColor: analytics.byStatus.map((s) => STATUS_COLORS[s.status] || 'rgba(156,163,175,0.85)'),
      borderWidth: 0,
      hoverBorderWidth: 3,
      hoverBorderColor: 'rgba(124, 58, 237, 0.6)',
    }],
  } : null

  const priorityChartData = analytics ? {
    labels: analytics.byPriority.map((p) => p.priority),
    datasets: [{
      data: analytics.byPriority.map((p) => p.count),
      backgroundColor: analytics.byPriority.map((p) => PRIORITY_COLORS[p.priority] || 'rgba(156,163,175,0.85)'),
      borderWidth: 0,
      hoverBorderWidth: 3,
      hoverBorderColor: 'rgba(124, 58, 237, 0.6)',
    }],
  } : null

  const productDistChartData = analytics && analytics.productDistribution.length > 0 ? {
    labels: analytics.productDistribution.map((p) => p.code),
    datasets: [{
      label: 'Products',
      data: analytics.productDistribution.map((p) => p.productCount),
      backgroundColor: 'rgba(124, 58, 237, 0.75)',
      hoverBackgroundColor: 'rgba(124, 58, 237, 1)',
      borderRadius: 6,
    }],
  } : null

  const doughnutOptions = (onClick: (_event: any, elements: any[]) => void) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(27, 54, 93, 0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    onClick,
    onHover: (event: any) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = 'pointer'
      }
    },
  })

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(27, 54, 93, 0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
      x: { grid: { display: false } },
    },
  }

  const handleStatusChartClick = (_event: any, elements: any[]) => {
    if (elements.length > 0 && analytics) {
      const index = elements[0].index
      const clickedStatus = analytics.byStatus[index].status
      toggleStatus(clickedStatus)
    }
  }

  const handlePriorityChartClick = (_event: any, elements: any[]) => {
    if (elements.length > 0 && analytics) {
      const index = elements[0].index
      const clickedPriority = analytics.byPriority[index].priority
      if (clickedPriority === 'NONE') return
      setFilters((prev) => ({
        ...prev,
        priority: prev.priority === clickedPriority ? '' : clickedPriority,
      }))
    }
  }

  // Computed KPIs
  const approvedCount = portfolios.filter((p) => p.governanceState === 'APPROVED').length
  const totalProducts = portfolios.reduce((sum, p) => sum + (p.products?.length || 0), 0)
  const totalBudget = analytics?.financials.totalEstimatedBudget || 0
  const totalActualCost = analytics?.financials.totalActualCost || 0
  const budgetVariance = totalBudget > 0 ? totalBudget - totalActualCost : 0
  const budgetUtilization = totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0
  const budgetHealthy = budgetUtilization <= 100

  const selectedDeleteProductCount = selectedPortfolio?.products?.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading portfolios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ─── Section A: Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B365D] tracking-tight">Portfolios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Executive overview of {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} and their health
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Portfolio
          </Button>
        )}
      </div>

      {/* ─── Section B: Filter Bar ─── */}
      <Card className="shadow-sm border">
        <CardContent className="py-4">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Status chips */}
            <div className="flex-1 min-w-[280px]">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.statuses.includes(status)
                        ? 'bg-[#1B365D] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="w-[160px]">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Priority</p>
              <Select value={filters.priority || 'ALL'} onValueChange={(v) => setFilters((f) => ({ ...f, priority: v === 'ALL' ? '' : v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manager */}
            <div className="w-[180px]">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Manager</p>
              <Select value={filters.managerId || 'ALL'} onValueChange={(v) => setFilters((f) => ({ ...f, managerId: v === 'ALL' ? '' : v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All managers</SelectItem>
                  {analytics?.managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="w-[220px]">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Created</p>
              <div className="flex gap-1.5">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Active:</span>
              {filters.statuses.map((status) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1B365D]/10 text-[#1B365D] text-xs font-medium"
                >
                  {status.replace('_', ' ')}
                  <button onClick={() => toggleStatus(status)} className="hover:text-red-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {filters.priority && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  Priority: {filters.priority}
                  <button onClick={() => setFilters((f) => ({ ...f, priority: '' }))} className="hover:text-red-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.managerId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                  Manager: {analytics?.managers.find((m) => m.id === filters.managerId)?.name || 'Selected'}
                  <button onClick={() => setFilters((f) => ({ ...f, managerId: '' }))} className="hover:text-red-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  {filters.dateFrom || '...'} — {filters.dateTo || '...'}
                  <button onClick={() => setFilters((f) => ({ ...f, dateFrom: '', dateTo: '' }))} className="hover:text-red-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
                Reset all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section C: Executive KPI Summary ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#1B365D] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Portfolios</p>
                <p className="text-3xl font-bold text-[#1B365D] mt-1">{portfolios.length}</p>
              </div>
              <div className="p-2.5 bg-[#1B365D]/5 rounded-lg">
                <Briefcase className="h-6 w-6 text-[#1B365D]/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{approvedCount}</p>
                {portfolios.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.round((approvedCount / portfolios.length) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="p-2.5 bg-green-500/5 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{totalProducts}</p>
                {portfolios.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ~{(totalProducts / portfolios.length).toFixed(1)} per portfolio
                  </p>
                )}
              </div>
              <div className="p-2.5 bg-purple-500/5 rounded-lg">
                <Package className="h-6 w-6 text-purple-500/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${
          totalBudget > 0
            ? budgetHealthy ? 'border-l-green-500' : 'border-l-red-500'
            : 'border-l-amber-500'
        }`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Health</p>
                {totalBudget > 0 ? (
                  <>
                    <p className={`text-3xl font-bold mt-1 ${budgetHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {budgetUtilization}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBudget(totalActualCost)} / {formatBudget(totalBudget)} SAR
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-amber-600 mt-1">—</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No budget data yet</p>
                  </>
                )}
              </div>
              <div className={`p-2.5 rounded-lg ${
                totalBudget > 0
                  ? budgetHealthy ? 'bg-green-500/5' : 'bg-red-500/5'
                  : 'bg-amber-500/5'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  totalBudget > 0
                    ? budgetHealthy ? 'text-green-500/40' : 'text-red-500/40'
                    : 'text-amber-500/40'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Section D: Visual Insights ─── */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-[#7C3AED]" />
                By Status
              </CardTitle>
              <p className="text-xs text-muted-foreground">Click a segment to filter</p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {statusChartData && statusChartData.labels.length > 0 ? (
                  <Doughnut data={statusChartData} options={doughnutOptions(handleStatusChartClick)} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-[#7C3AED]" />
                By Priority
              </CardTitle>
              <p className="text-xs text-muted-foreground">Click a segment to filter</p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {priorityChartData && priorityChartData.labels.length > 0 ? (
                  <Doughnut data={priorityChartData} options={doughnutOptions(handlePriorityChartClick)} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 text-[#7C3AED]" />
                Products per Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {productDistChartData ? (
                  <Bar data={productDistChartData} options={barOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Section E: Portfolio Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1B365D]">
            All Portfolios
            <span className="text-muted-foreground font-normal ml-2 text-sm">({portfolios.length})</span>
          </h2>
        </div>

        {portfolios.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="shadow-sm hover:shadow-lg border hover:border-[#7C3AED]/30 transition-all duration-200 flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-to-br from-[#1B365D] to-[#7C3AED] rounded-lg shrink-0">
                        <FolderKanban className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold truncate leading-tight">{portfolio.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground">{portfolio.code}</p>
                      </div>
                    </div>
                    {/* Always-visible action buttons */}
                    {isSuperAdmin && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => { e.preventDefault(); openEdit(portfolio) }}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          title="Edit portfolio"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); handleLockToggle(portfolio) }}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          title={portfolio.isLocked ? 'Unlock portfolio' : 'Lock portfolio'}
                        >
                          {portfolio.isLocked
                            ? <Unlock className="h-3.5 w-3.5 text-amber-500" />
                            : <Lock className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />}
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); openDelete(portfolio) }}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete portfolio"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status + Priority badges */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <StatusBadge status={portfolio.governanceState} />
                    {portfolio.priority && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        portfolio.priority === 'HIGH' || portfolio.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          : portfolio.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'bg-green-50 text-green-700 ring-1 ring-green-200'
                      }`}>
                        {portfolio.priority}
                      </span>
                    )}
                    {portfolio.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-xs font-medium">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                    {portfolio.description || 'No description provided'}
                  </p>

                  {/* Key metrics */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Products
                      </span>
                      <span className="font-semibold">{portfolio.products?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> Budget
                      </span>
                      <span className="font-semibold">
                        {portfolio.estimatedBudget
                          ? `${formatBudget(Number(portfolio.estimatedBudget))} SAR`
                          : '—'}
                      </span>
                    </div>
                    {portfolio.programManager && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Manager
                        </span>
                        <span className="font-medium truncate ml-2 max-w-[140px]">
                          {portfolio.programManager.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Created
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(portfolio.createdAt)}</span>
                    </div>
                  </div>

                  <Link href={`/portfolios/${portfolio.id}`} className="block mt-auto">
                    <Button variant="outline" size="sm" className="w-full group border-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/5 hover:border-[#7C3AED]/40">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                <FolderKanban className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No portfolios found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                {hasActiveFilters
                  ? 'No portfolios match your current filters. Try adjusting or resetting them.'
                  : 'Get started by creating your first portfolio to organize and track products.'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" /> Reset Filters
                </Button>
              ) : isSuperAdmin ? (
                <Button onClick={openCreate} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create Portfolio
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Create Portfolio Dialog ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>Set up a new portfolio to group and manage related products.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="create-name">Portfolio Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Enterprise Digital Suite"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-code">Code</Label>
              <Input
                id="create-code"
                value={formData.code}
                onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Auto-generated if empty"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Uppercase identifier. Auto-generated from name if left empty.</p>
            </div>
            <div>
              <Label htmlFor="create-desc">Description</Label>
              <Textarea
                id="create-desc"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this portfolio's purpose and scope..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-budget">Estimated Budget (SAR)</Label>
                <Input
                  id="create-budget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData((f) => ({ ...f, estimatedBudget: e.target.value }))}
                  placeholder="100,000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name.trim()} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
              {saving ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Portfolio Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>Update details for {selectedPortfolio?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program Manager</Label>
                <Select value={formData.programManagerId || 'NONE'} onValueChange={(v) => setFormData((f) => ({ ...f, programManagerId: v === 'NONE' ? '' : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {analytics?.managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-budget">Estimated Budget (SAR)</Label>
              <Input id="edit-budget" type="number" value={formData.estimatedBudget} onChange={(e) => setFormData((f) => ({ ...f, estimatedBudget: e.target.value }))} placeholder="100,000" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving || !formData.name.trim()} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Portfolio
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedDeleteProductCount > 0 ? (
                <span className="block">
                  <strong className="text-destructive">{selectedPortfolio?.name}</strong> contains{' '}
                  <strong className="text-destructive">{selectedDeleteProductCount} product{selectedDeleteProductCount !== 1 ? 's' : ''}</strong>.
                  Deleting this portfolio will permanently remove all associated products and their data.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete <strong>{selectedPortfolio?.name}</strong>? This action cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedDeleteProductCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Consider archiving instead if you want to preserve historical data.</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
