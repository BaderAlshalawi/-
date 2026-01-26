import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, GovernanceState } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = await canPerform(user, 'product:approve', {
      productId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate state
    if (product.governanceState !== GovernanceState.SUBMITTED) {
      return NextResponse.json(
        { error: 'Product must be in SUBMITTED state to reject' },
        { status: 400 }
      )
    }

    // Update product
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        governanceState: GovernanceState.REJECTED,
        rejectionReason: reason.trim(),
        rejectedAt: new Date(),
        rejectedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.REJECT,
      entityType: EntityType.PRODUCT,
      entityId: product.id,
      entityName: product.name,
      comment: `Product rejected: ${reason}`,
    })

    return NextResponse.json({ product: updated })
  } catch (error) {
    console.error('Reject product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
