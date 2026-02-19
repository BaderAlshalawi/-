import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { unfreezeSystem } from '@/lib/system'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await unfreezeSystem(user.id)

    await createAuditLog({
      actor: user,
      action: AuditAction.UNFREEZE,
      entityType: EntityType.SYSTEM,
      comment: 'System unfrozen',
    })

    return NextResponse.json({ success: true, message: 'System unfrozen' })
  } catch (error) {
    console.error('System unfreeze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
