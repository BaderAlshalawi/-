import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types'
import { getCurrentUser } from './auth'

/**
 * Role hierarchy for permission checking
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VIEWER,
  UserRole.CONTRIBUTOR,
  UserRole.PRODUCT_MANAGER,
  UserRole.PROGRAM_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
]

/**
 * Check if a user has a specific role or higher in the hierarchy
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole)
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)
  return userLevel >= requiredLevel
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Middleware helper to require specific role(s) for API routes
 * Returns user if authorized, otherwise returns a 403 response
 */
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

/**
 * Middleware helper to require minimum role level for API routes
 * Returns user if authorized, otherwise returns a 403 response
 */
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

/**
 * Client-side helper to check if current user has required role
 * Use this in components to conditionally render UI elements
 */
export function userHasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return hasRole(userRole, requiredRole)
}

/**
 * Client-side helper to check if current user has any of the required roles
 * Use this in components to conditionally render UI elements
 */
export function userHasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return hasAnyRole(userRole, allowedRoles)
}

/**
 * Client-side helper to check if current user has minimum role level
 * Use this in components to conditionally render UI elements
 */
export function userHasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return hasRole(userRole, minRole)
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.PROGRAM_MANAGER]: 'Program Manager',
    [UserRole.PRODUCT_MANAGER]: 'Product Manager',
    [UserRole.CONTRIBUTOR]: 'Contributor',
    [UserRole.VIEWER]: 'Viewer',
  }
  return roleNames[role] || role
}

/**
 * Get role color for UI badges
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
    [UserRole.ADMIN]: 'bg-red-100 text-red-800',
    [UserRole.PROGRAM_MANAGER]: 'bg-blue-100 text-blue-800',
    [UserRole.PRODUCT_MANAGER]: 'bg-green-100 text-green-800',
    [UserRole.CONTRIBUTOR]: 'bg-yellow-100 text-yellow-800',
    [UserRole.VIEWER]: 'bg-gray-100 text-gray-800',
  }
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}
