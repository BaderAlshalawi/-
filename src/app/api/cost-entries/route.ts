import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { updateCostRollups, type CostEntityType } from '@/lib/cost-calculator'
import { AuditAction, EntityType, type User } from '@/types'

const costEntityTypeEnum = z.enum([
  'PORTFOLIO',
  'PRODUCT',
  'FEATURE',
  'RELEASE',
])

const createCostEntrySchema = z.object({
  entityType: costEntityTypeEnum,
  entityId: z.string().uuid(),
  description: z.string().min(1).max(2000),
  amount: z.number().positive().finite(),
  currency: z.string().length(3).default('USD'),
  category: z.enum([
    'LABOR',
    'INFRASTRUCTURE',
    'LICENSING',
    'THIRD_PARTY',
    'OTHER',
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'cost:view')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as EntityType | null
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    const validTypes = [
      EntityType.PORTFOLIO,
      EntityType.PRODUCT,
      EntityType.FEATURE,
      EntityType.RELEASE,
    ]
    if (
      !validTypes.includes(
        entityType as (typeof validTypes)[number]
      )
    ) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
    }

    const entries = await prisma.costEntry.findMany({
      where: { entityType, entityId },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ costEntries: entries })
  } catch (error) {
    console.error('GET cost-entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'cost:create')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCostEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { entityType, entityId, description, amount, currency, category, date } =
      parsed.data

    // FR51: Enforce currency matches portfolio's costCurrency
    let portfolioCurrency: string | null = null
    if (entityType === 'PORTFOLIO') {
      const portfolio = await prisma.portfolio.findUnique({ where: { id: entityId }, select: { costCurrency: true } })
      portfolioCurrency = portfolio?.costCurrency || null
    } else if (entityType === 'PRODUCT') {
      const product = await prisma.product.findUnique({ where: { id: entityId }, select: { portfolio: { select: { costCurrency: true } } } })
      portfolioCurrency = product?.portfolio?.costCurrency || null
    } else if (entityType === 'FEATURE') {
      const feature = await prisma.feature.findUnique({ where: { id: entityId }, select: { product: { select: { portfolio: { select: { costCurrency: true } } } } } })
      portfolioCurrency = feature?.product?.portfolio?.costCurrency || null
    } else if (entityType === 'RELEASE') {
      const release = await prisma.release.findUnique({ where: { id: entityId }, select: { product: { select: { portfolio: { select: { costCurrency: true } } } } } })
      portfolioCurrency = release?.product?.portfolio?.costCurrency || null
    }

    if (portfolioCurrency && currency.toUpperCase() !== portfolioCurrency.toUpperCase()) {
      return NextResponse.json(
        { error: `Currency must match portfolio currency ${portfolioCurrency}` },
        { status: 400 }
      )
    }

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.costEntry.create({
        data: {
          entityType: entityType as EntityType,
          entityId,
          description,
          amount,
          currency,
          category,
          date: new Date(date),
          recordedById: user.id,
        },
        include: {
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })
      return created
    })

    await updateCostRollups(
      parsed.data.entityType as unknown as CostEntityType,
      entityId
    )

    await createAuditLog({
      actor: user as User,
      action: AuditAction.CREATE,
      entityType: EntityType.COST_ENTRY,
      entityId: entry.id,
      entityName: `Cost entry: ${description}`,
      changedFields: {
        amount: { old: undefined, new: amount },
        category: { old: undefined, new: category },
      },
    })

    return NextResponse.json({ costEntry: entry }, { status: 201 })
  } catch (error) {
    console.error('POST cost-entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
