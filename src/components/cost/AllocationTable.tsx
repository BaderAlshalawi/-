'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'

interface LookupItem { id: string; name: string }
interface Allocation {
  id: string
  hourlyCostSnapshot: number
  actualHours: number
  utilization: number
  actualCostComputed: number
  durationDaysComputed: number
  currency: string
  feature?: LookupItem | null
  phase?: LookupItem
  quarter?: LookupItem | null
  teamType?: LookupItem
  position?: LookupItem | null
  gradeRole?: LookupItem
}

interface AllocationTableProps {
  portfolioId: string
  canEdit: boolean
}

const fmt = (n: number) => Number(n).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function AllocationTable({ portfolioId, canEdit }: AllocationTableProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [totals, setTotals] = useState({ laborCostTotal: 0, hostingCostTotal: 0, portfolioTotalCost: 0 })
  const [loading, setLoading] = useState(true)

  const [phases, setPhases] = useState<LookupItem[]>([])
  const [quarters, setQuarters] = useState<LookupItem[]>([])
  const [teamTypes, setTeamTypes] = useState<LookupItem[]>([])
  const [positions, setPositions] = useState<LookupItem[]>([])
  const [gradeRoles, setGradeRoles] = useState<LookupItem[]>([])
  const [features, setFeatures] = useState<LookupItem[]>([])

  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoHourly, setAutoHourly] = useState<number | null>(null)
  const [form, setForm] = useState({
    featureId: '', phaseId: '', quarterId: '', teamTypeId: '',
    positionId: '', gradeRoleId: '', actualHours: '', utilization: '',
  })

  const fetchAllocations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/allocations`)
      const data = await res.json()
      setAllocations(data.allocations || [])
      setTotals(data.totals || { laborCostTotal: 0, hostingCostTotal: 0, portfolioTotalCost: 0 })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [portfolioId])

  const fetchLookups = useCallback(async () => {
    const [ph, qr, tt, ps, gr, ft] = await Promise.all([
      fetch('/api/lookups/phases').then((r) => r.json()),
      fetch('/api/lookups/quarters').then((r) => r.json()),
      fetch('/api/lookups/team-types').then((r) => r.json()),
      fetch('/api/lookups/positions').then((r) => r.json()),
      fetch('/api/lookups/grade-roles').then((r) => r.json()),
      fetch(`/api/lookups/features?portfolioId=${portfolioId}`).then((r) => r.json()),
    ])
    setPhases(ph.items || [])
    setQuarters(qr.items || [])
    setTeamTypes(tt.items || [])
    setPositions(ps.items || [])
    setGradeRoles(gr.items || [])
    setFeatures(ft.items || [])
  }, [portfolioId])

  useEffect(() => { fetchAllocations() }, [fetchAllocations])
  useEffect(() => { fetchLookups() }, [fetchLookups])

  useEffect(() => {
    if (!form.teamTypeId || !form.gradeRoleId) { setAutoHourly(null); return }
    const controller = new AbortController()
    fetch(`/api/rate-cards/lookup?teamTypeId=${form.teamTypeId}&gradeRoleId=${form.gradeRoleId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setAutoHourly(d.hourlyCost))
      .catch(() => {})
    return () => controller.abort()
  }, [form.teamTypeId, form.gradeRoleId])

  const handleAdd = async () => {
    if (!form.phaseId || !form.teamTypeId || !form.gradeRoleId || !form.actualHours || !form.utilization) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: form.featureId || null,
          phaseId: form.phaseId,
          quarterId: form.quarterId || null,
          teamTypeId: form.teamTypeId,
          positionId: form.positionId || null,
          gradeRoleId: form.gradeRoleId,
          actualHours: Number(form.actualHours),
          utilization: Number(form.utilization),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed')
        return
      }
      setAddOpen(false)
      setForm({ featureId: '', phaseId: '', quarterId: '', teamTypeId: '', positionId: '', gradeRoleId: '', actualHours: '', utilization: '' })
      setAutoHourly(null)
      fetchAllocations()
    } finally { setSaving(false) }
  }

  const handleDelete = async (allocId: string) => {
    if (!confirm('Remove this allocation line?')) return
    const res = await fetch(`/api/portfolios/${portfolioId}/allocations/${allocId}`, { method: 'DELETE' })
    if (res.ok) fetchAllocations()
  }

  const laborTotal = allocations.reduce((s, a) => s + Number(a.actualCostComputed), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resource Allocations</h3>
          <p className="text-sm text-muted-foreground">{allocations.length} allocation lines | Labor Total: <span className="font-semibold text-foreground">{fmt(laborTotal)} SAR</span></p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Allocation
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading allocations...</div>
          ) : allocations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No resource allocations yet</p>
              <p className="text-xs mt-1">Add allocation lines to track labor costs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Feature</TableHead>
                    <TableHead className="text-xs">Phase</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Position</TableHead>
                    <TableHead className="text-xs">Role / Grade</TableHead>
                    <TableHead className="text-xs text-right">Hourly (SAR)</TableHead>
                    <TableHead className="text-xs text-right">Hours</TableHead>
                    <TableHead className="text-xs text-right">Util %</TableHead>
                    <TableHead className="text-xs text-right">Actual Cost (SAR)</TableHead>
                    <TableHead className="text-xs text-right">Duration (days)</TableHead>
                    {canEdit && <TableHead className="text-xs w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a, idx) => (
                    <TableRow key={a.id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{a.feature?.name || '—'}</TableCell>
                      <TableCell>{a.phase?.name}</TableCell>
                      <TableCell>{a.teamType?.name}</TableCell>
                      <TableCell>{a.position?.name || '—'}</TableCell>
                      <TableCell>{a.gradeRole?.name}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(a.hourlyCostSnapshot)}</TableCell>
                      <TableCell className="text-right font-mono">{Number(a.actualHours).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{Math.round(Number(a.utilization) * 100)}%</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{fmt(a.actualCostComputed)}</TableCell>
                      <TableCell className="text-right font-mono">{Number(a.durationDaysComputed)}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <button onClick={() => handleDelete(a.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={9} className="text-right text-xs">LABOR TOTAL</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(laborTotal)} SAR</TableCell>
                    <TableCell></TableCell>
                    {canEdit && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource Allocation</DialogTitle>
            <DialogDescription>Hourly cost auto-fills from the rate card. Cost and duration are computed on save.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Feature</Label>
              <Select value={form.featureId || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, featureId: v === 'NONE' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— None —</SelectItem>
                  {features.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phase *</Label>
              <Select value={form.phaseId} onValueChange={(v) => setForm((f) => ({ ...f, phaseId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select phase" /></SelectTrigger>
                <SelectContent>
                  {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type (Team) *</Label>
              <Select value={form.teamTypeId} onValueChange={(v) => setForm((f) => ({ ...f, teamTypeId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {teamTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Position</Label>
              <Select value={form.positionId || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, positionId: v === 'NONE' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— None —</SelectItem>
                  {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade / Role *</Label>
              <Select value={form.gradeRoleId} onValueChange={(v) => setForm((f) => ({ ...f, gradeRoleId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {gradeRoles.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quarter</Label>
              <Select value={form.quarterId || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, quarterId: v === 'NONE' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— None —</SelectItem>
                  {quarters.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Actual Hours *</Label>
              <Input
                type="number" min="0"
                value={form.actualHours}
                onChange={(e) => setForm((f) => ({ ...f, actualHours: e.target.value }))}
                placeholder="e.g. 160"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Utilization (%) *</Label>
              <Input
                type="number" min="0" max="100"
                value={form.utilization}
                onChange={(e) => setForm((f) => ({ ...f, utilization: e.target.value }))}
                placeholder="e.g. 100"
                className="mt-1"
              />
            </div>
          </div>

          {autoHourly != null && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Rate card hourly cost: </span>
              <span className="font-semibold">{fmt(autoHourly)} SAR</span>
              {form.actualHours && form.utilization && (
                <>
                  <span className="text-muted-foreground ml-4">Estimated cost: </span>
                  <span className="font-semibold">
                    {fmt(autoHourly * Number(form.actualHours) * Number(form.utilization) / 100)} SAR
                  </span>
                </>
              )}
            </div>
          )}
          {autoHourly === null && form.teamTypeId && form.gradeRoleId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              No rate card found for this team type and grade/role combination.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.phaseId || !form.teamTypeId || !form.gradeRoleId || !form.actualHours || !form.utilization || autoHourly === null}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {saving ? 'Saving...' : 'Add Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
