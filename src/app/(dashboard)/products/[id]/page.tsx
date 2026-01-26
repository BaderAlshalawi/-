'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ProductActions } from '@/components/products/ProductActions'
import { Product } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetch(`/api/products/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setProduct(data.product)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading) {
    return <div>Loading product...</div>
  }

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.code}</p>
        </div>
        <ProductActions product={product} onUpdate={() => {
          fetch(`/api/products/${id}`)
            .then((res) => res.json())
            .then((data) => setProduct(data.product))
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
                <StatusBadge status={product.governanceState} />
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{product.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Portfolio</p>
              <p className="mt-1 text-sm text-gray-900">
                {product.portfolio?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(product.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.businessValue && (
              <div>
                <p className="text-sm font-medium text-gray-500">Business Value</p>
                <p className="mt-1 text-sm text-gray-900">{product.businessValue}</p>
              </div>
            )}
            {product.targetClient && (
              <div>
                <p className="text-sm font-medium text-gray-500">Target Client</p>
                <p className="mt-1 text-sm text-gray-900">{product.targetClient}</p>
              </div>
            )}
            {product.endUser && (
              <div>
                <p className="text-sm font-medium text-gray-500">End User</p>
                <p className="mt-1 text-sm text-gray-900">{product.endUser}</p>
              </div>
            )}
            {product.isLocked && (
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1 text-sm text-red-600 font-semibold">🔒 Locked</p>
              </div>
            )}
            {product.rejectionReason && (
              <div>
                <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                <p className="mt-1 text-sm text-red-600">{product.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
