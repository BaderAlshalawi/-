import { NextRequest, NextResponse } from 'next/server'
import { EntityType } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { canPerform } from '@/lib/permissions'
import type { User } from '@/types'
import { prisma } from '@/lib/prisma'
import {
  calculatePortfolioCost,
  calculateProductCost,
  calculateFeatureCost,
  calculateReleaseCost,
} from '@/lib/cost-calculator'

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

    let estimated: number | null = null
    let actual: number
    let currency: string = 'USD'

    switch (entityType as EntityType) {
      case EntityType.PORTFOLIO: {
        const portfolio = await prisma.portfolio.findUnique({
          where: { id: entityId },
          select: {
            estimatedBudget: true,
            actualCost: true,
            costCurrency: true,
          },
        })
        if (!portfolio) {
          return NextResponse.json(
            { error: 'Portfolio not found' },
            { status: 404 }
          )
        }
        estimated = toNumber(portfolio.estimatedBudget)
        const calculated = await calculatePortfolioCost(entityId)
        actual = toNumber(calculated)
        currency = portfolio.costCurrency ?? 'USD'
        break
      }
      case EntityType.PRODUCT: {
        const product = await prisma.product.findUnique({
          where: { id: entityId },
          select: {
            estimatedCost: true,
            actualCost: true,
            costCurrency: true,
          },
        })
        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          )
        }
        estimated = toNumber(product.estimatedCost)
        const calculated = await calculateProductCost(entityId)
        actual = toNumber(calculated)
        currency = product.costCurrency ?? 'USD'
        break
      }
      case EntityType.FEATURE: {
        const feature = await prisma.feature.findUnique({
          where: { id: entityId },
          select: {
            estimatedCost: true,
            actualCost: true,
            costCurrency: true,
          },
        })
        if (!feature) {
          return NextResponse.json(
            { error: 'Feature not found' },
            { status: 404 }
          )
        }
        estimated = toNumber(feature.estimatedCost)
        const calculated = await calculateFeatureCost(entityId)
        actual = toNumber(calculated)
        currency = feature.costCurrency ?? 'USD'
        break
      }
      case EntityType.RELEASE: {
        const release = await prisma.release.findUnique({
          where: { id: entityId },
          select: {
            estimatedCost: true,
            actualCost: true,
            costCurrency: true,
          },
        })
        if (!release) {
          return NextResponse.json(
            { error: 'Release not found' },
            { status: 404 }
          )
        }
        estimated = toNumber(release.estimatedCost)
        const calculated = await calculateReleaseCost(entityId)
        actual = toNumber(calculated)
        currency = release.costCurrency ?? 'USD'
        break
      }
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      entityType,
      entityId,
      estimated: estimated ?? null,
      actual,
      currency,
      variance:
        estimated != null ? actual - estimated : null,
    })
  } catch (error) {
    console.error('GET cost summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
