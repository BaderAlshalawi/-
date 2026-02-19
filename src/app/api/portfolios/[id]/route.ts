import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, type User } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: {
        programManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            governanceState: true,
            priority: true,
            productManagerId: true,
            productManager: {
              select: { id: true, name: true },
            },
            _count: { select: { features: true } },
          },
        },
        _count: {
          select: { products: true, documents: true },
        },
      },
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'portfolio:edit', { portfolioId: params.id })
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.portfolio.findUnique({
      where: { id: params.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json({ error: 'Portfolio is locked and cannot be edited' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    const changedFields: Record<string, { old: unknown; new: unknown }> = {}

    if (body.name !== undefined && body.name !== existing.name) {
      if (typeof body.name !== 'string' || body.name.length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
      }
      updateData.name = body.name
      changedFields.name = { old: existing.name, new: body.name }
    }

    if (body.description !== undefined && body.description !== existing.description) {
      updateData.description = body.description
      changedFields.description = { old: existing.description, new: body.description }
    }

    if (body.priority !== undefined && body.priority !== existing.priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
      }
      updateData.priority = body.priority
      changedFields.priority = { old: existing.priority, new: body.priority }
    }

    if (body.programManagerId !== undefined && body.programManagerId !== existing.programManagerId) {
      if (body.programManagerId) {
        const manager = await prisma.user.findUnique({
          where: { id: body.programManagerId },
          select: { id: true, role: true, status: true },
        })
        if (!manager || manager.status !== 'ACTIVE') {
          return NextResponse.json({ error: 'Manager not found or inactive' }, { status: 400 })
        }
      }
      updateData.programManagerId = body.programManagerId || null
      changedFields.programManagerId = { old: existing.programManagerId, new: body.programManagerId || null }
    }

    if (body.estimatedBudget !== undefined) {
      const budget = body.estimatedBudget != null ? Number(body.estimatedBudget) : null
      if (budget !== null && (isNaN(budget) || budget < 0)) {
        return NextResponse.json({ error: 'Estimated budget must be a positive number' }, { status: 400 })
      }
      updateData.estimatedBudget = budget
      changedFields.estimatedBudget = {
        old: existing.estimatedBudget ? Number(existing.estimatedBudget) : null,
        new: budget,
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.portfolio.update({
      where: { id: params.id },
      data: updateData,
      include: {
        programManager: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await createAuditLog({
      actor: user as any,
      action: AuditAction.UPDATE,
      entityType: EntityType.PORTFOLIO,
      entityId: updated.id,
      entityName: updated.name,
      changedFields,
    })

    return NextResponse.json({ portfolio: updated })
  } catch (error) {
    console.error('Update portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Only SUPER_ADMIN can delete portfolios
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { products: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete a locked portfolio. Unlock it first.' },
        { status: 400 }
      )
    }

    if (existing.governanceState === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot delete an approved portfolio. Archive it instead.' },
        { status: 400 }
      )
    }

    await prisma.portfolio.delete({ where: { id: params.id } })

    await createAuditLog({
      actor: user as any,
      action: AuditAction.DELETE,
      entityType: EntityType.PORTFOLIO,
      entityId: existing.id,
      entityName: existing.name,
      comment: `Portfolio deleted (had ${existing._count.products} products)`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
