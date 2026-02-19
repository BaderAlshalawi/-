'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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

interface HostingCost {
  id: string
  category: string
  amount: number
  currency: string
  notes?: string | null
  period?: string | null
}

const CATEGORIES = [
  { value: 'LICENSE', label: 'License' },
  { value: 'INFRA', label: 'Infrastructure' },
  { value: 'OTHERS', label: 'Others' },
  { value: 'INDIRECT', label: 'Indirect' },
]

const fmt = (n: number) => Number(n).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface HostingCostTableProps {
  portfolioId: string
  canEdit: boolean
}

export function HostingCostTable({ portfolioId, canEdit }: HostingCostTableProps) {
  const [costs, setCosts] = useState<HostingCost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: '', amount: '', notes: '', period: '' })

  const fetchCosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/hosting-costs`)
      const data = await res.json()
      setCosts(data.costs || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [portfolioId])

  useEffect(() => { fetchCosts() }, [fetchCosts])

  const handleAdd = async () => {
    if (!form.category || !form.amount) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/hosting-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: Number(form.amount),
          notes: form.notes || null,
          period: form.period || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed')
        return
      }
      setAddOpen(false)
      setForm({ category: '', amount: '', notes: '', period: '' })
      fetchCosts()
    } finally { setSaving(false) }
  }

  const handleDelete = async (costId: string) => {
    if (!confirm('Remove this hosting cost?')) return
    const res = await fetch(`/api/portfolios/${portfolioId}/hosting-costs/${costId}`, { method: 'DELETE' })
    if (res.ok) fetchCosts()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hosting / Non-Labor Costs</h3>
          <p className="text-sm text-muted-foreground">
            {costs.length} items | Total: <span className="font-semibold text-foreground">{fmt(total)} SAR</span>
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Cost
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : costs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No hosting costs recorded</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right">Amount (SAR)</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                  <TableHead className="text-xs">Period</TableHead>
                  {canEdit && <TableHead className="text-xs w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">
                      {CATEGORIES.find((cat) => cat.value === c.category)?.label || c.category}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(c.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.notes || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.period || '—'}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell className="text-xs">TOTAL</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(total)} SAR</TableCell>
                  <TableCell colSpan={canEdit ? 3 : 2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Hosting Cost</DialogTitle>
            <DialogDescription>Add a non-labor cost (license, infrastructure, etc.)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (SAR) *</Label>
              <Input
                type="number" min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1"
                placeholder="e.g. 98742.54"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1"
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Period</Label>
              <Input
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                className="mt-1"
                placeholder="e.g. Q1 2024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.category || !form.amount}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {saving ? 'Saving...' : 'Add Cost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
