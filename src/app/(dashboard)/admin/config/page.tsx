'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { AlertTriangle, Lock, Unlock } from 'lucide-react'

export default function ConfigPage() {
  const user = useAuthStore((state) => state.user)
  const { isFrozen, freezeReason, setIsFrozen } = useSystemStore()
  const [loading, setLoading] = useState(false)
  const [freezeReasonInput, setFreezeReasonInput] = useState('')

  useEffect(() => {
    fetch('/api/system/status')
      .then((res) => res.json())
      .then((data) => {
        setIsFrozen(data.frozen, data.reason)
      })
      .catch(console.error)
  }, [setIsFrozen])

  const handleFreeze = async () => {
    if (!freezeReasonInput.trim()) {
      alert('Please provide a reason for freezing the system')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/system/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'freeze', reason: freezeReasonInput }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Freeze failed')
        return
      }

      setIsFrozen(true, freezeReasonInput)
      setFreezeReasonInput('')
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfreeze = async () => {
    if (!confirm('Are you sure you want to unfreeze the system?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/system/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfreeze' }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Unfreeze failed')
        return
      }

      setIsFrozen(false, null)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-2">Manage system settings</p>
      </div>

      {!isSuperAdmin && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">You do not have permission to access this page</p>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>System Freeze Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">System Status:</span>
                {isFrozen ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    FROZEN
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Unlock className="h-3 w-3" />
                    ACTIVE
                  </Badge>
                )}
              </div>
              {isFrozen && freezeReason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Freeze Reason:</p>
                      <p className="text-sm text-red-700 mt-1">{freezeReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isFrozen ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="freezeReason">Freeze Reason *</Label>
                  <Textarea
                    id="freezeReason"
                    value={freezeReasonInput}
                    onChange={(e) => setFreezeReasonInput(e.target.value)}
                    placeholder="Enter the reason for freezing the system..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleFreeze}
                  disabled={loading || !freezeReasonInput.trim()}
                  variant="destructive"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Freezing...' : 'Freeze System'}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleUnfreeze}
                disabled={loading}
                variant="default"
              >
                <Unlock className="h-4 w-4 mr-2" />
                {loading ? 'Unfreezing...' : 'Unfreeze System'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
