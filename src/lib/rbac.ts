import { UserRole } from '@/types'

/**
 * Role hierarchy for permission checking (v3.0 — 4-role model)
 * ADMIN and CONTRIBUTOR roles have been permanently removed.
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VIEWER,
  UserRole.PRODUCT_MANAGER,
  UserRole.PROGRAM_MANAGER,
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
 * Client-side helper to check if current user has required role
 */
export function userHasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return hasRole(userRole, requiredRole)
}

/**
 * Client-side helper to check if current user has any of the required roles
 */
export function userHasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return hasAnyRole(userRole, allowedRoles)
}

/**
 * Client-side helper to check if current user has minimum role level
 */
export function userHasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return hasRole(userRole, minRole)
}

/**
 * Get user-friendly role display name (v3.0 — 4-role model)
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
    [UserRole.PROGRAM_MANAGER]: 'Program Manager',
    [UserRole.PRODUCT_MANAGER]: 'Product Manager',
    [UserRole.VIEWER]: 'Viewer',
  }
  return roleNames[role] || role
}

/**
 * Get role color for UI badges (v3.0 — 4-role model)
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
    [UserRole.PROGRAM_MANAGER]: 'bg-blue-100 text-blue-800',
    [UserRole.PRODUCT_MANAGER]: 'bg-green-100 text-green-800',
    [UserRole.VIEWER]: 'bg-gray-100 text-gray-800',
  }
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}
