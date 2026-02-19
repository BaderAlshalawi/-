'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Users, UserCheck, AlertTriangle, Activity, Search, DollarSign } from 'lucide-react'

interface Resource {
  id: string
  name: string
  email: string
  role: string
  status: string
  costRate: number | null
  costRateCurrency: string | null
  utilisation: number
  utilisationStatus: string
  activeAssignmentCount: number
}

interface KPIs {
  totalAvailable: number
  totalNearCapacity: number
  totalOverAllocated: number
  averageUtilisation: number
}

interface Assignment {
  id: string
  utilisation: number
  startDate: string
  endDate: string
  monthlyRateCached: number | null
  user: { id: string; name: string; email: string; role: string }
  product: { id: string; name: string; code: string }
}

export default function ResourceManagementPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [resources, setResources] = useState<Resource[]>([])
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'directory' | 'assignments'>('directory')
  const [editingCostRate, setEditingCostRate] = useState<string | null>(null)
  const [costRateAmount, setCostRateAmount] = useState('')
  const [costRateCurrency, setCostRateCurrency] = useState('SAR')
  const [loading, setLoading] = useState(true)

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch(`/api/resources?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources)
        setKpis(data.kpis)
      }
    } catch (e) {
      console.error('Failed to fetch resources:', e)
    } finally {
      setLoading(false)
    }
  }, [search])

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/resource-assignments')
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments)
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchResources()
    fetchAssignments()
  }, [user, router, fetchResources, fetchAssignments])

  const handleUpdateCostRate = async (userId: string) => {
    const amount = parseFloat(costRateAmount)
    if (isNaN(amount) || amount < 0) return
    try {
      const res = await fetch(`/api/resources/${userId}/cost-rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: costRateCurrency }),
      })
      if (res.ok) {
        setEditingCostRate(null)
        setCostRateAmount('')
        fetchResources()
      }
    } catch (e) {
      console.error('Failed to update cost rate:', e)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      const res = await fetch(`/api/resource-assignments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAssignments()
        fetchResources()
      }
    } catch (e) {
      console.error('Failed to delete assignment:', e)
    }
  }

  const getUtilBadge = (status: string, util: number) => {
    switch (status) {
      case 'OVER_ALLOCATED':
        return <Badge variant="destructive">{util}% Over-Allocated</Badge>
      case 'NEAR_CAPACITY':
        return <Badge className="bg-amber-500 text-white">{util}% Near Capacity</Badge>
      default:
        return <Badge className="bg-green-500 text-white">{util}% Available</Badge>
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1B365D] to-[#7C3AED] rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Resource Management</h1>
        <p className="text-white/80">Manage resource directory, cost rates, and assignments</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-green-500">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{kpis.totalAvailable}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-amber-500">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{kpis.totalNearCapacity}</div>
                <div className="text-sm text-muted-foreground">Near Capacity</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{kpis.totalOverAllocated}</div>
                <div className="text-sm text-muted-foreground">Over-Allocated</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{kpis.averageUtilisation}%</div>
                <div className="text-sm text-muted-foreground">Avg Utilisation</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Resource Directory
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Assignments
        </button>
      </div>

      {activeTab === 'directory' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resource Directory</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Cost Rate</th>
                    <th className="py-3 px-4 font-medium">Utilisation</th>
                    <th className="py-3 px-4 font-medium">Assignments</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{r.role.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {editingCostRate === r.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={costRateAmount}
                              onChange={(e) => setCostRateAmount(e.target.value)}
                              className="w-24 h-8"
                              placeholder="Amount"
                            />
                            <Input
                              value={costRateCurrency}
                              onChange={(e) => setCostRateCurrency(e.target.value)}
                              className="w-16 h-8"
                              maxLength={3}
                            />
                            <Button size="sm" onClick={() => handleUpdateCostRate(r.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCostRate(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span>
                            {r.costRate != null
                              ? `${Number(r.costRate).toLocaleString()} ${r.costRateCurrency}/mo`
                              : 'Not set'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getUtilBadge(r.utilisationStatus, r.utilisation)}</td>
                      <td className="py-3 px-4">{r.activeAssignmentCount}</td>
                      <td className="py-3 px-4">
                        {editingCostRate !== r.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCostRate(r.id)
                              setCostRateAmount(r.costRate != null ? String(r.costRate) : '')
                              setCostRateCurrency(r.costRateCurrency || 'SAR')
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" /> Set Rate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No resources found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'assignments' && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Resource</th>
                    <th className="py-3 px-4 font-medium">Product</th>
                    <th className="py-3 px-4 font-medium">Period</th>
                    <th className="py-3 px-4 font-medium">Utilisation</th>
                    <th className="py-3 px-4 font-medium">Monthly Cost</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{a.user.name}</div>
                        <div className="text-xs text-muted-foreground">{a.user.role.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{a.product.name}</div>
                        <div className="text-xs text-muted-foreground">{a.product.code}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{Number(a.utilisation)}%</td>
                      <td className="py-3 px-4">
                        {a.monthlyRateCached != null
                          ? `${Number(a.monthlyRateCached).toLocaleString()} SAR`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAssignment(a.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No assignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
