'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FeatureState, Feature } from '@/types'
import { ArrowRight } from 'lucide-react'

interface FeatureLifecycleProps {
  feature: Feature
  onUpdate: () => void
}

const validTransitions: Record<FeatureState, FeatureState[]> = {
  DISCOVERY: ['READY'],
  READY: ['IN_PROGRESS', 'DISCOVERY'],
  IN_PROGRESS: ['RELEASED', 'READY'],
  RELEASED: ['ARCHIVED'],
  ARCHIVED: [],
}

const stateLabels: Record<FeatureState, string> = {
  DISCOVERY: 'Discovery',
  READY: 'Ready',
  IN_PROGRESS: 'In Progress',
  RELEASED: 'Released',
  ARCHIVED: 'Archived',
}

export function FeatureLifecycle({ feature, onUpdate }: FeatureLifecycleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const currentState = feature.state
  const allowedStates = validTransitions[currentState]

  const handleTransition = async (newState: FeatureState) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Transition failed')
        return
      }

      onUpdate()
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (allowedStates.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          Current state: <strong>{stateLabels[currentState]}</strong>
        </p>
        <p className="text-xs text-gray-500 mt-1">No transitions available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Current State: <span className="font-semibold">{stateLabels[currentState]}</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">Available transitions:</p>
        <div className="flex gap-2 flex-wrap">
          {allowedStates.map((state) => (
            <Button
              key={state}
              onClick={() => handleTransition(state)}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Move to {stateLabels[state]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
