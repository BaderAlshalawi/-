import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (user) {
      await createAuditLog({
        actor: user,
        action: AuditAction.DELETE,
        entityType: EntityType.USER,
        entityId: user.id,
        entityName: user.email,
        comment: 'User logged out',
      })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
