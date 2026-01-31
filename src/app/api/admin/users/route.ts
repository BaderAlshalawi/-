import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMinRole } from '@/lib/rbac'
import { UserRole } from '@/types'

/**
 * Example protected API route - Only ADMIN and above can access
 * GET /api/admin/users - List all users
 */
export async function GET(request: NextRequest) {
  // Require ADMIN role or higher
  const auth = await requireMinRole(request, UserRole.ADMIN)

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
