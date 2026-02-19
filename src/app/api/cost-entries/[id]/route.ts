import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { updateCostRollups, type CostEntityType } from '@/lib/cost-calculator'
import { AuditAction, EntityType, type User } from '@/types'

const updateCostEntrySchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  amount: z.number().positive().finite().optional(),
  currency: z.string().length(3).optional(),
  category: z
    .enum([
      'LABOR',
      'INFRASTRUCTURE',
      'LICENSING',
      'THIRD_PARTY',
      'OTHER',
    ])
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'cost:edit')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const existing = await prisma.costEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cost entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateCostEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.costEntry.update({
      where: { id },
      data: {
        ...(parsed.data.description != null && {
          description: parsed.data.description,
        }),
        ...(parsed.data.amount != null && { amount: parsed.data.amount }),
        ...(parsed.data.currency != null && {
          currency: parsed.data.currency,
        }),
        ...(parsed.data.category != null && {
          category: parsed.data.category,
        }),
        ...(parsed.data.date != null && {
          date: new Date(parsed.data.date),
        }),
      },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await updateCostRollups(
      existing.entityType as CostEntityType,
      existing.entityId
    )

    const changedFields: Record<string, { old: unknown; new: unknown }> = {}
    if (parsed.data.description != null)
      changedFields.description = {
        old: existing.description,
        new: parsed.data.description,
      }
    if (parsed.data.amount != null)
      changedFields.amount = { old: existing.amount, new: parsed.data.amount }
    if (parsed.data.category != null)
      changedFields.category = { old: existing.category, new: parsed.data.category }

    await createAuditLog({
      actor: user as User,
      action: AuditAction.UPDATE,
      entityType: EntityType.SYSTEM,
      entityId: id,
      entityName: `Cost entry: ${updated.description}`,
      changedFields,
    })

    return NextResponse.json({ costEntry: updated })
  } catch (error) {
    console.error('PUT cost-entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'cost:delete')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const existing = await prisma.costEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cost entry not found' }, { status: 404 })
    }

    const entityType = existing.entityType
    const entityId = existing.entityId

    await prisma.costEntry.delete({
      where: { id },
    })

    await updateCostRollups(entityType as CostEntityType, entityId)

    await createAuditLog({
      actor: user as User,
      action: AuditAction.DELETE,
      entityType: EntityType.SYSTEM,
      entityId: id,
      entityName: `Cost entry: ${existing.description}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE cost-entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
