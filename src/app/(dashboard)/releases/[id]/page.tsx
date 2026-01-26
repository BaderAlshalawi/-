'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { GoNoGoDecision } from '@/components/releases/GoNoGoDecision'
import { Release } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ReleaseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetch(`/api/releases/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setRelease(data.release)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading) {
    return <div>Loading release...</div>
  }

  if (!release) {
    return <div>Release not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{release.name}</h1>
        <p className="text-gray-600 mt-2">Version {release.version}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={release.governanceState} />
              </div>
            </div>
            {release.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{release.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Timeline</p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(release.startDate)} - {formatDate(release.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Product</p>
              <p className="mt-1 text-sm text-gray-900">
                {release.product?.name || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Go/No-Go Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {release.goNogoSubmitted ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Decision</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {release.goNogoDecision || 'Pending'}
                  </p>
                </div>
                {release.goNogoNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="mt-1 text-sm text-gray-900">{release.goNogoNotes}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Not yet submitted for Go/No-Go</p>
            )}
          </CardContent>
        </Card>

        <GoNoGoDecision
          release={release}
          onUpdate={() => {
            fetch(`/api/releases/${id}`)
              .then((res) => res.json())
              .then((data) => setRelease(data.release))
          }}
        />
      </div>
    </div>
  )
}
