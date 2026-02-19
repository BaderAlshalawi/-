'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PortfolioActions } from '@/components/portfolios/PortfolioActions'
import { PortfolioCostDashboard } from '@/components/cost/PortfolioCostDashboard'
import { AllocationTable } from '@/components/cost/AllocationTable'
import { HostingCostTable } from '@/components/cost/HostingCostTable'
import { ResourceFinancialDashboard } from '@/components/cost/ResourceFinancialDashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Portfolio, EntityType } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  FolderKanban, Package, Users, DollarSign, ArrowLeft,
  Plus, Trash2, Lock, BarChart3, Layers, FileText, Pencil,
  TrendingUp, TrendingDown, AlertTriangle, Percent
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

type TabKey = 'overview' | 'products' | 'resources' | 'allocations' | 'financials'

interface ResourceAssignment {
  id: string
  userId: string
  productId: string
  utilisation: number
  startDate: string
  endDate: string
  monthlyRateCached: number | null
  user: { id: string; name: string; email: string; role: string }
  product: { id: string; name: string; code: string }
  assignedBy?: { id: string; name: string } | null
}

interface ResourceSummary {
  totalAssignments: number
  uniqueResources: number
  averageUtilisation: number
  totalMonthlyCost: number
}

interface AvailableResource {
  id: string
  name: string
  email: string
  role: string
  costRate: number | null
}

interface ManagerOption {
  id: string
  name: string
  email: string
}

function formatBudget(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString()
}

export default function PortfolioDetailPage() {
  const params = useParams()
  const id = params.id as string
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Resources state
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([])
  const [resourceSummary, setResourceSummary] = useState<ResourceSummary | null>(null)
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([])

  // Add resource dialog
  const [addResourceOpen, setAddResourceOpen] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    userId: '', productId: '', utilisation: '50', startDate: '', endDate: '',
  })
  const [savingResource, setSavingResource] = useState(false)

  // Edit portfolio dialog
  const [editOpen, setEditOpen] = useState(false)
  const [managers, setManagers] = useState<ManagerOption[]>([])
  const [editForm, setEditForm] = useState({
    name: '', description: '', priority: 'MEDIUM', programManagerId: '', estimatedBudget: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`/api/portfolios/${id}`)
      const data = await res.json()
      setPortfolio(data.portfolio)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchResources = useCallback(async () => {
    setResourcesLoading(true)
    try {
      const res = await fetch(`/api/portfolios/${id}/resources`)
      const data = await res.json()
      setAssignments(data.assignments || [])
      setResourceSummary(data.summary || null)
    } catch (err) {
      console.error(err)
    } finally {
      setResourcesLoading(false)
    }
  }, [id])

  const fetchAvailableResources = useCallback(async () => {
    try {
      const res = await fetch('/api/resources?limit=100')
      const data = await res.json()
      setAvailableResources(
        (data.resources || []).map((r: any) => ({
          id: r.id, name: r.name, email: r.email, role: r.role, costRate: r.costRate,
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchManagers = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolios/analytics')
      const data = await res.json()
      setManagers(data.managers || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    if (id) fetchPortfolio()
  }, [id, fetchPortfolio])

  useEffect(() => {
    if (activeTab === 'resources' && id) {
      fetchResources()
      fetchAvailableResources()
    }
  }, [activeTab, id, fetchResources, fetchAvailableResources])

  // Edit handlers
  const openEdit = () => {
    if (!portfolio) return
    fetchManagers()
    setEditForm({
      name: portfolio.name,
      description: portfolio.description || '',
      priority: portfolio.priority || 'MEDIUM',
      programManagerId: portfolio.programManagerId || '',
      estimatedBudget: portfolio.estimatedBudget ? String(portfolio.estimatedBudget) : '',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!portfolio || !editForm.name.trim()) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          priority: editForm.priority,
          programManagerId: editForm.programManagerId || null,
          estimatedBudget: editForm.estimatedBudget ? Number(editForm.estimatedBudget) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to update portfolio')
        return
      }
      setEditOpen(false)
      fetchPortfolio()
    } catch {
      alert('Failed to update portfolio')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleAddResource = async () => {
    if (!resourceForm.userId || !resourceForm.productId || !resourceForm.startDate || !resourceForm.endDate) {
      alert('Please fill all required fields')
      return
    }
    setSavingResource(true)
    try {
      const res = await fetch(`/api/portfolios/${id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resourceForm.userId,
          productId: resourceForm.productId,
          utilisation: Number(resourceForm.utilisation),
          startDate: resourceForm.startDate,
          endDate: resourceForm.endDate,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to assign resource')
        return
      }
      setAddResourceOpen(false)
      setResourceForm({ userId: '', productId: '', utilisation: '50', startDate: '', endDate: '' })
      fetchResources()
    } catch {
      alert('Failed to assign resource')
    } finally {
      setSavingResource(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this resource assignment?')) return
    try {
      const res = await fetch(`/api/portfolios/${id}/resources/${assignmentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to remove assignment')
        return
      }
      fetchResources()
    } catch {
      alert('Failed to remove assignment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
            <FolderKanban className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Portfolio not found</h3>
          <p className="text-sm text-muted-foreground mb-4">This portfolio may have been deleted or you don&apos;t have access.</p>
          <Link href="/portfolios">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Portfolios</Button>
          </Link>
        </div>
      </div>
    )
  }

  const products: any[] = portfolio.products || []

  // Products by status chart
  const productStatusMap: Record<string, number> = {}
  products.forEach((p) => {
    productStatusMap[p.governanceState] = (productStatusMap[p.governanceState] || 0) + 1
  })
  const productStatusColors: Record<string, string> = {
    DRAFT: 'rgba(156, 163, 175, 0.85)',
    SUBMITTED: 'rgba(139, 92, 246, 0.85)',
    APPROVED: 'rgba(34, 197, 94, 0.85)',
    REJECTED: 'rgba(239, 68, 68, 0.85)',
    LOCKED: 'rgba(27, 54, 93, 0.85)',
    ARCHIVED: 'rgba(107, 114, 128, 0.85)',
  }

  const productStatusChart = Object.keys(productStatusMap).length > 0 ? {
    labels: Object.keys(productStatusMap).map((s) => s.replace('_', ' ')),
    datasets: [{
      data: Object.values(productStatusMap),
      backgroundColor: Object.keys(productStatusMap).map((s) => productStatusColors[s] || 'rgba(156,163,175,0.85)'),
      borderWidth: 0,
    }],
  } : null

  const totalFeatures = products.reduce((sum: number, p: any) => sum + (p._count?.features || 0), 0)

  // Financial calculations
  const estimatedBudget = portfolio.estimatedBudget ? Number(portfolio.estimatedBudget) : null
  const actualCost = portfolio.actualCost ? Number(portfolio.actualCost) : 0
  const variance = estimatedBudget != null ? estimatedBudget - actualCost : null
  const marginPercent = estimatedBudget != null && estimatedBudget > 0
    ? Math.round((variance! / estimatedBudget) * 100)
    : null
  const isOverBudget = variance != null && variance < 0

  const tabs: { key: TabKey; label: string; icon: any; badge?: string | number }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'products', label: 'Products', icon: Package, badge: products.length },
    { key: 'resources', label: 'Resources', icon: Users },
    { key: 'allocations', label: 'Allocations', icon: Layers },
    { key: 'financials', label: 'Financials', icon: DollarSign, badge: estimatedBudget ? undefined : '!' },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* ─── Header ─── */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/portfolios" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Portfolios
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium truncate">{portfolio.name}</span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1B365D] tracking-tight">{portfolio.name}</h1>
              {portfolio.isLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-xs font-medium">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{portfolio.code}</span>
              <span className="text-muted-foreground/30">|</span>
              <StatusBadge status={portfolio.governanceState} />
              {portfolio.priority && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    portfolio.priority === 'HIGH' || portfolio.priority === 'CRITICAL'
                      ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                      : portfolio.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      : 'bg-green-50 text-green-700 ring-1 ring-green-200'
                  }`}>
                    {portfolio.priority}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && !portfolio.isLocked && (
              <Button onClick={openEdit} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Portfolio
              </Button>
            )}
            <PortfolioActions portfolio={portfolio} onUpdate={fetchPortfolio} />
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="border-b border-border">
        <nav className="flex gap-0" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? 'border-[#7C3AED] text-[#7C3AED]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge != null && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    tab.badge === '!'
                      ? 'bg-amber-100 text-amber-700'
                      : isActive
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-[#1B365D] shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Products</p>
                    <p className="text-3xl font-bold text-[#1B365D] mt-1">{products.length}</p>
                  </div>
                  <div className="p-2.5 bg-[#1B365D]/5 rounded-lg">
                    <Package className="h-6 w-6 text-[#1B365D]/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Features</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{totalFeatures}</p>
                  </div>
                  <div className="p-2.5 bg-purple-500/5 rounded-lg">
                    <Layers className="h-6 w-6 text-purple-500/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documents</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{(portfolio as any)._count?.documents || 0}</p>
                  </div>
                  <div className="p-2.5 bg-green-500/5 rounded-lg">
                    <FileText className="h-6 w-6 text-green-500/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 shadow-sm ${
              estimatedBudget != null
                ? isOverBudget ? 'border-l-red-500' : 'border-l-green-500'
                : 'border-l-amber-500'
            }`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Status</p>
                    {estimatedBudget != null ? (
                      <>
                        <p className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          {isOverBudget ? 'Over' : 'On Track'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatBudget(actualCost)} / {formatBudget(estimatedBudget)} SAR
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-amber-600 mt-1">—</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No budget set</p>
                      </>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-lg ${
                    estimatedBudget != null
                      ? isOverBudget ? 'bg-red-500/5' : 'bg-green-500/5'
                      : 'bg-amber-500/5'
                  }`}>
                    <DollarSign className={`h-6 w-6 ${
                      estimatedBudget != null
                        ? isOverBudget ? 'text-red-500/40' : 'text-green-500/40'
                        : 'text-amber-500/40'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details + Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="mt-1 text-sm leading-relaxed">{portfolio.description}</p>
                  </div>
                )}
                {portfolio.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Rejection Reason</p>
                    <p className="mt-1 text-sm text-red-800">{portfolio.rejectionReason}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                    <p className="mt-1 text-sm">{formatDate(portfolio.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</p>
                    <p className="mt-1 text-sm">{formatDate(portfolio.updatedAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Program Manager</p>
                  <p className="mt-1 text-sm">
                    {portfolio.programManager
                      ? `${portfolio.programManager.name} (${portfolio.programManager.email})`
                      : <span className="text-muted-foreground italic">Unassigned</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Products by Status</CardTitle>
                <CardDescription>{products.length} product{products.length !== 1 ? 's' : ''} in this portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {productStatusChart ? (
                    <Doughnut
                      data={productStatusChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: {
                          legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
                          tooltip: {
                            backgroundColor: 'rgba(27, 54, 93, 0.95)',
                            padding: 10,
                            cornerRadius: 8,
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Package className="h-10 w-10 text-muted-foreground/20 mb-2" />
                      <p className="text-sm text-muted-foreground">No products yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Products will appear here once added</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Products Tab ─── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length > 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Manager</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{product.code}</TableCell>
                        <TableCell><StatusBadge status={product.governanceState} /></TableCell>
                        <TableCell>
                          {product.priority && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.priority === 'HIGH' || product.priority === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                : product.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                : 'bg-green-50 text-green-700 ring-1 ring-green-200'
                            }`}>
                              {product.priority}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{product._count?.features || 0}</TableCell>
                        <TableCell className="text-sm">{product.productManager?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No products yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Products assigned to this portfolio will appear here. Create products from the Products module and assign them to this portfolio.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Resources Tab ─── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {resourceSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-[#1B365D] shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignments</p>
                  <p className="text-2xl font-bold text-[#1B365D] mt-1">{resourceSummary.totalAssignments}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique Resources</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{resourceSummary.uniqueResources}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Utilisation</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{resourceSummary.averageUtilisation}%</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Cost</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {resourceSummary.totalMonthlyCost > 0
                      ? `${resourceSummary.totalMonthlyCost.toLocaleString()} SAR`
                      : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {isSuperAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setAddResourceOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                <Plus className="h-4 w-4 mr-2" /> Assign Resource
              </Button>
            </div>
          )}

          {resourcesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : assignments.length > 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Utilisation</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      {isSuperAdmin && <TableHead className="w-[60px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{a.user.name}</p>
                            <p className="text-xs text-muted-foreground">{a.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{a.product.name}</span>
                            <span className="text-xs font-mono text-muted-foreground">{a.product.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  Number(a.utilisation) > 100
                                    ? 'bg-red-500'
                                    : Number(a.utilisation) >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(Number(a.utilisation), 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Number(a.utilisation)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(a.startDate)} — {formatDate(a.endDate)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {a.monthlyRateCached
                            ? `${Number(a.monthlyRateCached).toLocaleString()} SAR`
                            : '—'}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <button
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              title="Remove assignment"
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No resource assignments</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Assign team members to products in this portfolio to track utilisation and costs.
                </p>
                {isSuperAdmin && (
                  <Button onClick={() => setAddResourceOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                    <Plus className="h-4 w-4 mr-2" /> Assign Resource
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Resource Dialog */}
          <Dialog open={addResourceOpen} onOpenChange={setAddResourceOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Resource</DialogTitle>
                <DialogDescription>Assign a team member to a product in this portfolio.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Resource *</Label>
                  <Select value={resourceForm.userId} onValueChange={(v) => setResourceForm((f) => ({ ...f, userId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select team member" /></SelectTrigger>
                    <SelectContent>
                      {availableResources.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Product *</Label>
                  <Select value={resourceForm.productId} onValueChange={(v) => setResourceForm((f) => ({ ...f, productId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="res-util">Utilisation % *</Label>
                  <Input
                    id="res-util"
                    type="number"
                    min="1"
                    max="200"
                    value={resourceForm.utilisation}
                    onChange={(e) => setResourceForm((f) => ({ ...f, utilisation: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="res-start">Start Date *</Label>
                    <Input
                      id="res-start"
                      type="date"
                      value={resourceForm.startDate}
                      onChange={(e) => setResourceForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="res-end">End Date *</Label>
                    <Input
                      id="res-end"
                      type="date"
                      value={resourceForm.endDate}
                      onChange={(e) => setResourceForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddResourceOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleAddResource}
                  disabled={savingResource || !resourceForm.userId || !resourceForm.productId}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                >
                  {savingResource ? 'Assigning...' : 'Assign Resource'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ─── Allocations Tab ─── */}
      {activeTab === 'allocations' && (
        <div className="space-y-8">
          <AllocationTable
            portfolioId={id}
            canEdit={isSuperAdmin && !portfolio.isLocked}
          />
          <HostingCostTable
            portfolioId={id}
            canEdit={isSuperAdmin && !portfolio.isLocked}
          />
        </div>
      )}

      {/* ─── Financials Tab ─── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Resource-based Financial Dashboard (labor + hosting + breakdowns) */}
          <ResourceFinancialDashboard portfolioId={id} />

          {/* Budget warning / setup prompt */}
          {estimatedBudget == null && (
            <Card className="shadow-sm border-amber-200 bg-amber-50/50">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-amber-100 rounded-lg shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">Budget not configured</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Set an estimated budget to enable variance tracking, margin calculations, and budget health monitoring.
                    </p>
                    {isSuperAdmin && !portfolio.isLocked && (
                      <Button onClick={openEdit} variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Set Budget
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing cost entry dashboard (for backward compat) */}
          <PortfolioCostDashboard
            entityType={EntityType.PORTFOLIO}
            entityId={id}
            entityName={portfolio.name}
            canEdit={isSuperAdmin && !portfolio.isLocked}
          />
        </div>
      )}

      {/* ─── Edit Portfolio Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>Update details for {portfolio.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="detail-edit-name">Name *</Label>
              <Input
                id="detail-edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="detail-edit-desc">Description</Label>
              <Textarea
                id="detail-edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
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
                <Select
                  value={editForm.programManagerId || 'NONE'}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, programManagerId: v === 'NONE' ? '' : v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="detail-edit-budget">Estimated Budget (SAR)</Label>
              <Input
                id="detail-edit-budget"
                type="number"
                value={editForm.estimatedBudget}
                onChange={(e) => setEditForm((f) => ({ ...f, estimatedBudget: e.target.value }))}
                placeholder="100,000"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to calculate variance and margin against actual costs.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editForm.name.trim()}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
