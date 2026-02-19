import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireMinRole } from '@/lib/rbac-server'
import { UserRole } from '@/types'

/**
 * Protected API route - Only SUPER_ADMIN can access (BRD v3.0)
 * GET /api/admin/users - List all users
 */
export async function GET(request: NextRequest) {
  const auth = await requireMinRole(request, UserRole.SUPER_ADMIN)

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        assignedPortfolioId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
