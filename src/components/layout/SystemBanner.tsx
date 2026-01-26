'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useSystemStore } from '@/store/systemStore'

export function SystemBanner() {
  const { isFrozen, freezeReason, setIsFrozen } = useSystemStore()

  useEffect(() => {
    // Check system status on mount
    fetch('/api/system/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.frozen) {
          setIsFrozen(true, data.reason)
        }
      })
      .catch(console.error)
  }, [setIsFrozen])

  if (!isFrozen) return null

  return (
    <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5" />
      <div className="flex-1">
        <p className="font-semibold">System Frozen</p>
        {freezeReason && <p className="text-sm text-red-100">{freezeReason}</p>}
      </div>
    </div>
  )
}
