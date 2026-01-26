'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PortfolioActions } from '@/components/portfolios/PortfolioActions'
import { Portfolio } from '@/types'
import { formatDate } from '@/lib/utils'

export default function PortfolioDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetch(`/api/portfolios/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setPortfolio(data.portfolio)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading) {
    return <div>Loading portfolio...</div>
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{portfolio.name}</h1>
          <p className="text-gray-600 mt-2">{portfolio.code}</p>
        </div>
        <PortfolioActions portfolio={portfolio} onUpdate={() => {
          fetch(`/api/portfolios/${id}`)
            .then((res) => res.json())
            .then((data) => setPortfolio(data.portfolio))
        }} />
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
                <StatusBadge status={portfolio.governanceState} />
              </div>
            </div>
            {portfolio.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{portfolio.description}</p>
              </div>
            )}
            {portfolio.isLocked && (
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1 text-sm text-red-600 font-semibold">🔒 Locked</p>
              </div>
            )}
            {portfolio.rejectionReason && (
              <div>
                <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                <p className="mt-1 text-sm text-red-600">{portfolio.rejectionReason}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(portfolio.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>{portfolio.products?.length || 0} products in this portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio.products && portfolio.products.length > 0 ? (
              <ul className="space-y-2">
                {portfolio.products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{product.name}</span>
                    <StatusBadge status={product.governanceState} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No products yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
