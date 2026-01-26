'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Feature } from '@/types'
import { Zap, ArrowRight } from 'lucide-react'

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/features')
      .then((res) => res.json())
      .then((data) => {
        setFeatures(data.features || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Loading features...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Features</h1>
        <p className="text-gray-600 mt-2">Manage your features</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-gray-400" />
                  <div>
                    <CardTitle>{feature.name}</CardTitle>
                    <CardDescription>
                      {feature.product?.name || 'No product'}
                    </CardDescription>
                  </div>
                </div>
                <StatusBadge status={feature.state} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {feature.description || 'No description'}
              </p>
              <Link href={`/features/${feature.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {features.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No features found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
