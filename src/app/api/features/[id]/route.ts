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

    const feature = await prisma.feature.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        release: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Get feature error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
