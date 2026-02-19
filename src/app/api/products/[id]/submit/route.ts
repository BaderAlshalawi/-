import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
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

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = await canPerform(user, 'product:submit', {
      productId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate state — allow resubmission after rejection
    if (product.governanceState !== GovernanceState.DRAFT && product.governanceState !== GovernanceState.REJECTED) {
      return NextResponse.json(
        { error: 'Product must be in DRAFT or REJECTED state to submit' },
        { status: 400 }
      )
    }

    // Update product
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        governanceState: GovernanceState.SUBMITTED,
        submittedAt: new Date(),
        submittedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.SUBMIT,
      entityType: EntityType.PRODUCT,
      entityId: product.id,
      entityName: product.name,
      comment: 'Product roadmap submitted',
    })

    return NextResponse.json({ product: updated })
  } catch (error) {
    console.error('Submit product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
