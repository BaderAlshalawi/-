import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        productManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        releases: {
          select: {
            id: true,
            version: true,
            name: true,
            governanceState: true,
          },
        },
        features: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
