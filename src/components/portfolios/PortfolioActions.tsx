'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RejectDialog } from '@/components/common/RejectDialog'
import { GovernanceState, Portfolio } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { canPerform } from '@/lib/permissions'
import { Send, Check, X, Lock, Unlock } from 'lucide-react'

interface PortfolioActionsProps {
  portfolio: Portfolio
  onUpdate: () => void
}

export function PortfolioActions({ portfolio, onUpdate }: PortfolioActionsProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)

  if (!user) return null

  const handleAction = async (action: string, data?: any) => {
    setLoading(action)
    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Action failed')
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

  const handleReject = (reason: string) => {
    handleAction('reject', { reason })
  }

  // Check permissions
  const canSubmit = portfolio.governanceState === GovernanceState.DRAFT
  const canApprove = portfolio.governanceState === GovernanceState.SUBMITTED
  const canReject = portfolio.governanceState === GovernanceState.SUBMITTED
  const canLock = portfolio.governanceState === GovernanceState.APPROVED && !portfolio.isLocked
  const canUnlock = portfolio.isLocked

  return (
    <div className="flex gap-2 flex-wrap">
      {canSubmit && (
        <Button
          onClick={() => handleAction('submit')}
          disabled={loading !== null}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading === 'submit' ? 'Submitting...' : 'Submit Roadmap'}
        </Button>
      )}

      {canApprove && (
        <Button
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          size="sm"
          variant="default"
        >
          <Check className="h-4 w-4 mr-2" />
          {loading === 'approve' ? 'Approving...' : 'Approve'}
        </Button>
      )}

      {canReject && (
        <>
          <Button
            onClick={() => setRejectOpen(true)}
            disabled={loading !== null}
            size="sm"
            variant="destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <RejectDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            onConfirm={handleReject}
            title="Reject Portfolio Roadmap"
            description="Please provide a reason for rejecting this portfolio roadmap."
          />
        </>
      )}

      {canLock && (
        <Button
          onClick={() => handleAction('lock')}
          disabled={loading !== null}
          size="sm"
          variant="outline"
        >
          <Lock className="h-4 w-4 mr-2" />
          {loading === 'lock' ? 'Locking...' : 'Lock Portfolio'}
        </Button>
      )}

      {canUnlock && (
        <Button
          onClick={() => handleAction('unlock')}
          disabled={loading !== null}
          size="sm"
          variant="outline"
        >
          <Unlock className="h-4 w-4 mr-2" />
          {loading === 'unlock' ? 'Unlocking...' : 'Unlock Portfolio'}
        </Button>
      )}
    </div>
  )
}
