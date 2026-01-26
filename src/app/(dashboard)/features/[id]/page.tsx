'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { FeatureLifecycle } from '@/components/features/FeatureLifecycle'
import { Feature } from '@/types'
import { formatDate } from '@/lib/utils'

export default function FeatureDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetch(`/api/features/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setFeature(data.feature)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading) {
    return <div>Loading feature...</div>
  }

  if (!feature) {
    return <div>Feature not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{feature.name}</h1>
        <p className="text-gray-600 mt-2">Feature Details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">State</p>
              <div className="mt-1">
                <StatusBadge status={feature.state} />
              </div>
            </div>
            {feature.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{feature.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Product</p>
              <p className="mt-1 text-sm text-gray-900">
                {feature.product?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(feature.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feature.targetUser && (
              <div>
                <p className="text-sm font-medium text-gray-500">Target User</p>
                <p className="mt-1 text-sm text-gray-900">{feature.targetUser}</p>
              </div>
            )}
            {feature.valueProposition && (
              <div>
                <p className="text-sm font-medium text-gray-500">Value Proposition</p>
                <p className="mt-1 text-sm text-gray-900">{feature.valueProposition}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Management</CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureLifecycle
              feature={feature}
              onUpdate={() => {
                fetch(`/api/features/${id}`)
                  .then((res) => res.json())
                  .then((data) => setFeature(data.feature))
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
