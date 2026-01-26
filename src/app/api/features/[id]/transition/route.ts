import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType, FeatureState } from '@/types'

const validTransitions: Record<FeatureState, FeatureState[]> = {
  DISCOVERY: ['READY'],
  READY: ['IN_PROGRESS', 'DISCOVERY'],
  IN_PROGRESS: ['RELEASED', 'READY'],
  RELEASED: ['ARCHIVED'],
  ARCHIVED: [],
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newState } = await request.json()

    if (!newState || !Object.values(FeatureState).includes(newState)) {
      return NextResponse.json(
        { error: 'Invalid state provided' },
        { status: 400 }
      )
    }

    const feature = await prisma.feature.findUnique({
      where: { id: params.id },
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Check permissions
    const hasPermission = await canPerform(user, 'feature:transition', {
      featureId: params.id,
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate transition
    const currentState = feature.state as FeatureState
    const allowedStates = validTransitions[currentState]

    if (!allowedStates.includes(newState)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentState} to ${newState}. Valid transitions: ${allowedStates.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Update feature
    const updated = await prisma.feature.update({
      where: { id: params.id },
      data: {
        state: newState,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.UPDATE,
      entityType: EntityType.FEATURE,
      entityId: feature.id,
      entityName: feature.name,
      changedFields: {
        state: { old: currentState, new: newState },
      },
      comment: `Feature state changed from ${currentState} to ${newState}`,
    })

    return NextResponse.json({ feature: updated })
  } catch (error) {
    console.error('Transition feature error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
