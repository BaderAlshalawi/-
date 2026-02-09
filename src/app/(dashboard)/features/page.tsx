'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Feature } from '@/types'
import { Zap, ArrowRight, Package, CheckCircle2, Clock } from 'lucide-react'

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading features...</p>
        </div>
      </div>
    )
  }

  const completedFeatures = features.filter((f) => f.state === 'RELEASED' || f.state === 'ARCHIVED')
  const inProgressFeatures = features.filter((f) => f.state === 'IN_PROGRESS' || f.state === 'READY')

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Features</h1>
            <p className="text-purple-100 text-lg">Track and manage all product features</p>
          </div>
          <Zap className="h-16 w-16 opacity-20" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Features</p>
                <p className="text-3xl font-bold text-purple-600">{features.length}</p>
              </div>
              <Zap className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedFeatures.length}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressFeatures.length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      {features.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="card-hover border-2 border-gray-200 hover:border-purple-500 transition-all shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{feature.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Package className="h-3 w-3" />
                        {feature.product?.name || 'No product'}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <StatusBadge status={feature.state} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                  {feature.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  {feature.priority && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Priority:</span>
                      <span
                        className={`font-medium px-2 py-1 rounded text-xs ${
                          feature.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : feature.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {feature.priority}
                      </span>
                    </div>
                  )}
                  {feature.owner && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium text-gray-900">{feature.owner?.name ?? feature.ownerId ?? '—'}</span>
                    </div>
                  )}
                  {feature.startDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(feature.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <Link href={`/features/${feature.id}`} className="block">
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
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-500">Get started by creating your first feature</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
