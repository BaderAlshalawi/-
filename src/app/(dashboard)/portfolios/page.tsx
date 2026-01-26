'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Portfolio } from '@/types'
import { FolderKanban, ArrowRight } from 'lucide-react'

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolios')
      .then((res) => res.json())
      .then((data) => {
        setPortfolios(data.portfolios || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Loading portfolios...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolios</h1>
        <p className="text-gray-600 mt-2">Manage your portfolios</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-6 w-6 text-gray-400" />
                  <div>
                    <CardTitle>{portfolio.name}</CardTitle>
                    <CardDescription>{portfolio.code}</CardDescription>
                  </div>
                </div>
                <StatusBadge status={portfolio.governanceState} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {portfolio.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {portfolio.products?.length || 0} products
                </span>
                <Link href={`/portfolios/${portfolio.id}`}>
                  <Button variant="outline" size="sm">
                    View <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {portfolios.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No portfolios found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
