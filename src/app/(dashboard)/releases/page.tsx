'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Release } from '@/types'
import { Rocket, ArrowRight, Calendar, Package, CheckCircle2, Clock } from 'lucide-react'
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading releases...</p>
        </div>
      </div>
    )
  }

  const approvedReleases = releases.filter((r) => r.governanceState === 'APPROVED')
  const upcomingReleases = releases.filter((r) => {
    const now = new Date()
    const endDate = new Date(r.endDate)
    return endDate > now
  })

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Releases</h1>
            <p className="text-orange-100 text-lg">Plan and track product releases</p>
          </div>
          <Rocket className="h-16 w-16 opacity-20" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-orange-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Releases</p>
                <p className="text-3xl font-bold text-orange-600">{releases.length}</p>
              </div>
              <Rocket className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedReleases.length}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-primary">{upcomingReleases.length}</p>
              </div>
              <Clock className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Releases Grid */}
      {releases.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {releases.map((release) => (
            <Card
              key={release.id}
              className="card-hover border-2 border-border hover:border-orange-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{release.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        v{release.version}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <StatusBadge status={release.governanceState} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                  {release.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span className="truncate">{release.product?.name || 'No product'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(release.startDate)} - {formatDate(release.endDate)}
                    </span>
                  </div>
                  {release.features && release.features.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Features:</span>
                      <span className="font-medium text-gray-900">
                        {release.features.length}
                      </span>
                    </div>
                  )}
                </div>

                <Link href={`/releases/${release.id}`} className="block">
                  <Button variant="default" size="sm" className="w-full group">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No releases found</h3>
            <p className="text-gray-500">Get started by creating your first release</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
