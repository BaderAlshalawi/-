import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { canPerform } from '@/lib/permissions'
import { EntityType, type User } from '@/types'
import { prisma } from '@/lib/prisma'

const VALID_ENTITY_TYPES = [
  EntityType.PORTFOLIO,
  EntityType.PRODUCT,
  EntityType.FEATURE,
  EntityType.RELEASE,
] as const

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'cost:view')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { entityType, entityId } = params
    if (
      !VALID_ENTITY_TYPES.includes(entityType as (typeof VALID_ENTITY_TYPES)[number])
    ) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const entries = await prisma.costEntry.findMany({
      where: {
        entityType: entityType as EntityType,
        entityId,
      },
      orderBy: { date: 'desc' },
    })

    const byCategory: Record<string, number> = {}
    let total = 0
    for (const e of entries) {
      const amount = toNumber(e.amount)
      byCategory[e.category] = (byCategory[e.category] ?? 0) + amount
      total += amount
    }

    const breakdown = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
    }))

    return NextResponse.json({
      entityType,
      entityId,
      total,
      byCategory: breakdown,
      entryCount: entries.length,
    })
  } catch (error) {
    console.error('GET cost breakdown error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
