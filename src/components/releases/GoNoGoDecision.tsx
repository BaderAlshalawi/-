'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Release } from '@/types'
import { CheckCircle, XCircle, Send, Lock } from 'lucide-react'

interface GoNoGoDecisionProps {
  release: Release
  onUpdate: () => void
}

export function GoNoGoDecision({ release, onUpdate }: GoNoGoDecisionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [decision, setDecision] = useState<'GO' | 'NO_GO' | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!release.goNogoSubmitted) {
      setLoading('submit')
      try {
        const response = await fetch(`/api/releases/${release.id}/submit-go-nogo`, {
          method: 'POST',
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Submission failed')
          return
        }

        onUpdate()
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('An error occurred')
      } finally {
        setLoading(null)
      }
    }
  }

  const handleDecide = async () => {
    if (!decision) {
      alert('Please select a decision')
      return
    }

    setLoading('decide')
    try {
      const response = await fetch(`/api/releases/${release.id}/decide-go-nogo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Decision failed')
        return
      }

      setDecision(null)
      setNotes('')
      onUpdate()
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const handleLock = async () => {
    setLoading('lock')
    try {
      const response = await fetch(`/api/releases/${release.id}/lock`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Lock failed')
        return
      }

      onUpdate()
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Go/No-Go Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!release.goNogoSubmitted ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Submit this release for Go/No-Go decision after completing the readiness checklist.
            </p>
            <Button onClick={handleSubmit} disabled={loading !== null}>
              <Send className="h-4 w-4 mr-2" />
              {loading === 'submit' ? 'Submitting...' : 'Submit for Go/No-Go'}
            </Button>
          </div>
        ) : !release.goNogoDecision ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Make Go/No-Go Decision:</p>
            <div className="flex gap-4">
              <Button
                variant={decision === 'GO' ? 'default' : 'outline'}
                onClick={() => setDecision('GO')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                GO
              </Button>
              <Button
                variant={decision === 'NO_GO' ? 'destructive' : 'outline'}
                onClick={() => setDecision('NO_GO')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                NO-GO
              </Button>
            </div>
            <div>
              <Label htmlFor="notes">Decision Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the decision..."
                className="mt-2"
                rows={3}
              />
            </div>
            <Button onClick={handleDecide} disabled={loading !== null || !decision}>
              {loading === 'decide' ? 'Recording...' : 'Record Decision'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Decision:</p>
              <div className={`mt-2 p-3 rounded ${
                release.goNogoDecision === 'GO' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {release.goNogoDecision === 'GO' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{release.goNogoDecision}</span>
                </div>
              </div>
            </div>
            {release.goNogoNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Notes:</p>
                <p className="mt-1 text-sm text-gray-600">{release.goNogoNotes}</p>
              </div>
            )}
            {release.goNogoDecision === 'GO' && !release.isLocked && (
              <Button onClick={handleLock} disabled={loading !== null}>
                <Lock className="h-4 w-4 mr-2" />
                {loading === 'lock' ? 'Locking...' : 'Lock Release'}
              </Button>
            )}
            {release.isLocked && (
              <p className="text-sm text-red-600 font-semibold">🔒 Release is locked</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
