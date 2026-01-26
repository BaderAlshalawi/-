'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Release } from '@/types'
import { Rocket, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/releases')
      .then((res) => res.json())
      .then((data) => {
        setReleases(data.releases || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Loading releases...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Releases</h1>
        <p className="text-gray-600 mt-2">Manage your releases</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {releases.map((release) => (
          <Card key={release.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-gray-400" />
                  <div>
                    <CardTitle>{release.name}</CardTitle>
                    <CardDescription>v{release.version}</CardDescription>
                  </div>
                </div>
                <StatusBadge status={release.governanceState} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500">
                  {formatDate(release.startDate)} - {formatDate(release.endDate)}
                </p>
                <p className="text-sm text-gray-600">
                  {release.product?.name || 'No product'}
                </p>
              </div>
              <Link href={`/releases/${release.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {releases.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No releases found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
