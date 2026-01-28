import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

async function handleLogout(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (user) {
    try {
      await createAuditLog({
        actor: user,
        action: AuditAction.DELETE,
        entityType: EntityType.USER,
        entityId: user.id,
        entityName: user.email,
        comment: 'User logged out',
      })
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError)
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('auth-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}

export async function POST(request: NextRequest) {
  try {
    return await handleLogout(request)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handleLogout(request)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
