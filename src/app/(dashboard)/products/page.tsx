'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Product } from '@/types'
import { Package, ArrowRight, Zap, TrendingUp } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || [])
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
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-[#1B365D] to-[#7C3AED] rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Products</h1>
            <p className="text-white/80 text-lg">Manage and track all your products</p>
          </div>
          <Package className="h-16 w-16 opacity-20" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-3xl font-bold text-primary">{products.length}</p>
              </div>
              <Package className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <p className="text-3xl font-bold text-green-600">
                  {products.filter((p) => p.governanceState === 'APPROVED').length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolios</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(products.map((p) => p.portfolioId)).size}
                </p>
              </div>
              <Zap className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className="card-hover border-2 border-border hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 bg-gradient-to-br from-[#1B365D] to-[#7C3AED] rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{product.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {product.code}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <StatusBadge status={product.governanceState} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                  {product.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Portfolio:</span>
                    <span className="font-medium text-gray-900 truncate ml-2">
                      {product.portfolio?.name || 'N/A'}
                    </span>
                  </div>
                  {product.productManager && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium text-gray-900">{product.productManager.name}</span>
                    </div>
                  )}
                </div>

                <Link href={`/products/${product.id}`} className="block">
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
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Get started by creating your first product</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
