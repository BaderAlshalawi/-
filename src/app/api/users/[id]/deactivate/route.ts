import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, UserRole } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'user:deactivate', {})
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        portfoliosManaged: true,
        productsManaged: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'User is already inactive' },
        { status: 400 }
      )
    }

    // Leaver handling
    if (targetUser.role === UserRole.PROGRAM_MANAGER) {
      // Check if user manages any portfolios
      if (targetUser.portfoliosManaged.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot deactivate Program Manager with assigned portfolios. Please reassign portfolios first.',
          },
          { status: 400 }
        )
      }
    }

    // For Product Managers, products will be marked as unowned (productManagerId set to null)
    if (targetUser.role === UserRole.PRODUCT_MANAGER) {
      await prisma.product.updateMany({
        where: { productManagerId: targetUser.id },
        data: { productManagerId: null },
      })
    }

    // For Contributors, remove from feature assignments
    if (targetUser.role === UserRole.CONTRIBUTOR) {
      await prisma.featureContributorAssignment.deleteMany({
        where: { userId: targetUser.id },
      })
    }

    // Deactivate user
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.DEACTIVATE,
      entityType: EntityType.USER,
      entityId: targetUser.id,
      entityName: targetUser.email,
      comment: 'User deactivated',
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Deactivate user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
