'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RejectDialog } from '@/components/common/RejectDialog'
import { GovernanceState, Product } from '@/types'
import { Send, Check, X, Lock } from 'lucide-react'

interface ProductActionsProps {
  product: Product
  onUpdate: () => void
}

export function ProductActions({ product, onUpdate }: ProductActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleAction = async (action: string, data?: any) => {
    setLoading(action)
    try {
      const response = await fetch(`/api/products/${product.id}/${action}`, {
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

  const canSubmit = product.governanceState === GovernanceState.DRAFT
  const canApprove = product.governanceState === GovernanceState.SUBMITTED
  const canReject = product.governanceState === GovernanceState.SUBMITTED
  const canLock = product.governanceState === GovernanceState.APPROVED && !product.isLocked

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
            title="Reject Product Roadmap"
            description="Please provide a reason for rejecting this product roadmap."
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
          {loading === 'lock' ? 'Locking...' : 'Lock Product'}
        </Button>
      )}
    </div>
  )
}
