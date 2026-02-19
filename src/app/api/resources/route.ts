import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManage = await canPerform(user, 'resource:manage')
    const canView = await canPerform(user, 'resource:view-utilisation')
    if (!canManage && !canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const where: any = { status: 'ACTIVE' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          costRate: true,
          costRateCurrency: true,
          resourceAssignments: {
            select: {
              utilisation: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ])

    const now = new Date()
    const resources = users.map((u) => {
      const activeAssignments = u.resourceAssignments.filter(
        (a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now
      )
      const totalUtilisation = activeAssignments.reduce(
        (sum, a) => sum + Number(a.utilisation),
        0
      )
      let utilisationStatus: string
      if (totalUtilisation > 100) utilisationStatus = 'OVER_ALLOCATED'
      else if (totalUtilisation >= 80) utilisationStatus = 'NEAR_CAPACITY'
      else utilisationStatus = 'AVAILABLE'

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        costRate: u.costRate,
        costRateCurrency: u.costRateCurrency,
        utilisation: totalUtilisation,
        utilisationStatus,
        activeAssignmentCount: activeAssignments.length,
      }
    })

    const allActiveUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        resourceAssignments: {
          select: { utilisation: true, startDate: true, endDate: true },
        },
      },
    })

    let totalAvailable = 0
    let totalNearCapacity = 0
    let totalOverAllocated = 0
    let totalUtilAll = 0

    allActiveUsers.forEach((u) => {
      const active = u.resourceAssignments.filter(
        (a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now
      )
      const util = active.reduce((sum, a) => sum + Number(a.utilisation), 0)
      totalUtilAll += util
      if (util > 100) totalOverAllocated++
      else if (util >= 80) totalNearCapacity++
      else totalAvailable++
    })

    return NextResponse.json({
      resources,
      kpis: {
        totalAvailable,
        totalNearCapacity,
        totalOverAllocated,
        averageUtilisation: allActiveUsers.length > 0
          ? Math.round(totalUtilAll / allActiveUsers.length)
          : 0,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Get resources error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
