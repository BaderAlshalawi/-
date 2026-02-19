'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'

const LOOKUP_TYPES = [
  { key: 'phases', label: 'Phases' },
  { key: 'quarters', label: 'Quarters' },
  { key: 'team-types', label: 'Team Types' },
  { key: 'positions', label: 'Positions' },
  { key: 'grade-roles', label: 'Grade / Roles' },
]

interface LookupItem {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export default function LookupsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [activeType, setActiveType] = useState('phases')
  const [items, setItems] = useState<LookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lookups/${activeType}?activeOnly=${!showAll}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeType, showAll])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
    fetchItems()
  }, [user, router, fetchItems])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/lookups/${activeType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), sortOrder: items.length }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed')
        return
      }
      setNewName('')
      fetchItems()
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await fetch(`/api/lookups/${activeType}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      setEditId(null)
      fetchItems()
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleActive = async (item: LookupItem) => {
    try {
      await fetch(`/api/lookups/${activeType}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      fetchItems()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? If it is in use, consider deactivating instead.')) return
    try {
      const res = await fetch(`/api/lookups/${activeType}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to delete')
        return
      }
      fetchItems()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1B365D] to-[#7C3AED] rounded-xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Lookup Management</h1>
        <p className="text-white/80">Configure dropdown lists for resource management</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
        {LOOKUP_TYPES.map((lt) => (
          <button
            key={lt.key}
            onClick={() => { setActiveType(lt.key); setEditId(null) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeType === lt.key
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {lt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{LOOKUP_TYPES.find((t) => t.key === activeType)?.label}</CardTitle>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New item name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="max-w-xs"
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No items yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 px-3 font-medium w-12">#</th>
                    <th className="py-2 px-3 font-medium">Name</th>
                    <th className="py-2 px-3 font-medium w-20">Status</th>
                    <th className="py-2 px-3 font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={`border-b hover:bg-muted/50 ${!item.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-3">
                        {editId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                              className="h-8 max-w-xs"
                              autoFocus
                            />
                            <button onClick={() => handleUpdate(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditId(item.id); setEditName(item.name) }}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title={item.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {item.isActive
                              ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                              : <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
