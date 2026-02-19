/**
 * Server-only RBAC helpers that use auth. Do not import this from client components.
 * Client components should use @/lib/rbac (pure role helpers only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types'
import { getCurrentUser } from './auth'
import { hasRole, hasAnyRole } from './rbac'

export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ authorized: true; user: any } | { authorized: false; response: NextResponse }> {
  const user = await getCurrentUser(request)

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (!hasAnyRole(user.role, allowedRoles)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return { authorized: true, user }
}

export async function requireMinRole(
  request: NextRequest,
  minRole: UserRole
): Promise<{ authorized: true; user: any } | { authorized: false; response: NextResponse }> {
  const user = await getCurrentUser(request)

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (!hasRole(user.role, minRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return { authorized: true, user }
}
