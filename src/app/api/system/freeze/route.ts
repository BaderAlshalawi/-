import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { canPerform } from '@/lib/permissions'
import { freezeSystem, unfreezeSystem } from '@/lib/system'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Super Admin can freeze/unfreeze
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, reason } = await request.json()

    if (action === 'freeze') {
      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return NextResponse.json(
          { error: 'Freeze reason is required' },
          { status: 400 }
        )
      }

      await freezeSystem(reason.trim(), user.id)

      await createAuditLog({
        actor: user,
        action: AuditAction.FREEZE,
        entityType: EntityType.SYSTEM,
        comment: `System frozen: ${reason}`,
      })

      return NextResponse.json({ success: true, message: 'System frozen' })
    } else if (action === 'unfreeze') {
      await unfreezeSystem(user.id)

      await createAuditLog({
        actor: user,
        action: AuditAction.UNFREEZE,
        entityType: EntityType.SYSTEM,
        comment: 'System unfrozen',
      })

      return NextResponse.json({ success: true, message: 'System unfrozen' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "freeze" or "unfreeze"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('System freeze error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
