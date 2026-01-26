import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { hashPassword } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, UserRole } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'user:edit', {})
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        assignedPortfolio: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Get user error:', error)
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

    const hasPermission = await canPerform(user, 'user:edit', {})
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { email, name, role, assignedPortfolioId, password } = await request.json()

    const updateData: any = {}
    const changedFields: Record<string, { old: any; new: any }> = {}

    if (email !== undefined && email !== targetUser.email) {
      updateData.email = email
      changedFields.email = { old: targetUser.email, new: email }
    }

    if (name !== undefined && name !== targetUser.name) {
      updateData.name = name
      changedFields.name = { old: targetUser.name, new: name }
    }

    if (role !== undefined && role !== targetUser.role) {
      if (!Object.values(UserRole).includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
      changedFields.role = { old: targetUser.role, new: role }
    }

    if (assignedPortfolioId !== undefined && assignedPortfolioId !== targetUser.assignedPortfolioId) {
      updateData.assignedPortfolioId = assignedPortfolioId || null
      changedFields.assignedPortfolioId = { old: targetUser.assignedPortfolioId, new: assignedPortfolioId }
    }

    if (password !== undefined && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password)
      changedFields.password = { old: '***', new: '***' }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ user: targetUser })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.USER,
      entityId: targetUser.id,
      entityName: targetUser.email,
      changedFields,
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
