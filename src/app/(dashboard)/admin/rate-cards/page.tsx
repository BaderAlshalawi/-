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
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil } from 'lucide-react'

interface LookupItem { id: string; name: string }
interface RateCard {
  id: string
  teamTypeId: string
  gradeRoleId: string
  monthlyCost: number
  dailyCost: number
  hourlyCost: number
  currency: string
  isActive: boolean
  teamType?: LookupItem
  gradeRole?: LookupItem
}

export default function RateCardsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [cards, setCards] = useState<RateCard[]>([])
  const [teamTypes, setTeamTypes] = useState<LookupItem[]>([])
  const [gradeRoles, setGradeRoles] = useState<LookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTeamType, setFilterTeamType] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ teamTypeId: '', gradeRoleId: '', monthlyCost: '' })
  const [saving, setSaving] = useState(false)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTeamType) params.set('teamTypeId', filterTeamType)
      const res = await fetch(`/api/rate-cards?${params}`)
      const data = await res.json()
      setCards(data.cards || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterTeamType])

  const fetchLookups = useCallback(async () => {
    const [ttRes, grRes] = await Promise.all([
      fetch('/api/lookups/team-types'),
      fetch('/api/lookups/grade-roles'),
    ])
    const [ttData, grData] = await Promise.all([ttRes.json(), grRes.json()])
    setTeamTypes(ttData.items || [])
    setGradeRoles(grData.items || [])
  }, [])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
    fetchLookups()
  }, [user, router, fetchLookups])

  useEffect(() => { fetchCards() }, [fetchCards])

  const handleAdd = async () => {
    if (!form.teamTypeId || !form.gradeRoleId || !form.monthlyCost) return
    setSaving(true)
    try {
      const res = await fetch('/api/rate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamTypeId: form.teamTypeId,
          gradeRoleId: form.gradeRoleId,
          monthlyCost: Number(form.monthlyCost),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed')
        return
      }
      setAddOpen(false)
      setForm({ teamTypeId: '', gradeRoleId: '', monthlyCost: '' })
      fetchCards()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate card?')) return
    const res = await fetch(`/api/rate-cards/${id}`, { method: 'DELETE' })
    if (res.ok) fetchCards()
    else alert('Failed to delete')
  }

  const fmt = (n: number) => Number(n).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1B365D] to-[#7C3AED] rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Rate Cards</h1>
        <p className="text-white/80">Manage cost rates per team type and grade/role (22 working days, 8 hours/day)</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-64">
          <Select value={filterTeamType || 'ALL'} onValueChange={(v) => setFilterTeamType(v === 'ALL' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Filter by team type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Team Types</SelectItem>
              {teamTypes.map((tt) => (
                <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Rate Card
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : cards.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No rate cards found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Team Type</th>
                    <th className="py-3 px-4 font-medium">Grade / Role</th>
                    <th className="py-3 px-4 font-medium text-right">Monthly (SAR)</th>
                    <th className="py-3 px-4 font-medium text-right">Daily (SAR)</th>
                    <th className="py-3 px-4 font-medium text-right">Hourly (SAR)</th>
                    <th className="py-3 px-4 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{card.teamType?.name}</td>
                      <td className="py-3 px-4">{card.gradeRole?.name}</td>
                      <td className="py-3 px-4 text-right font-mono">{fmt(card.monthlyCost)}</td>
                      <td className="py-3 px-4 text-right font-mono">{fmt(card.dailyCost)}</td>
                      <td className="py-3 px-4 text-right font-mono">{fmt(card.hourlyCost)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1.5 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Rate Card</DialogTitle>
            <DialogDescription>Daily and hourly rates are auto-calculated from the monthly cost (22 days, 8 hours/day).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Team Type *</Label>
              <Select value={form.teamTypeId} onValueChange={(v) => setForm((f) => ({ ...f, teamTypeId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select team type" /></SelectTrigger>
                <SelectContent>
                  {teamTypes.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade / Role *</Label>
              <Select value={form.gradeRoleId} onValueChange={(v) => setForm((f) => ({ ...f, gradeRoleId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade/role" /></SelectTrigger>
                <SelectContent>
                  {gradeRoles.map((gr) => (
                    <SelectItem key={gr.id} value={gr.id}>{gr.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monthly Cost (SAR) *</Label>
              <Input
                type="number"
                value={form.monthlyCost}
                onChange={(e) => setForm((f) => ({ ...f, monthlyCost: e.target.value }))}
                placeholder="e.g. 36000"
                className="mt-1"
              />
              {form.monthlyCost && Number(form.monthlyCost) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Daily: {fmt(Number(form.monthlyCost) / 22)} SAR | Hourly: {fmt(Number(form.monthlyCost) / 22 / 8)} SAR
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.teamTypeId || !form.gradeRoleId || !form.monthlyCost}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {saving ? 'Saving...' : 'Create Rate Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
