'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { userHasAnyRole, userHasRole } from '@/lib/rbac'

interface ProtectedContentProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  minRole?: UserRole
  fallback?: ReactNode
}

/**
 * Component to conditionally render content based on user role
 *
 * Usage:
 * <ProtectedContent allowedRoles={[UserRole.SUPER_ADMIN]}>
 *   <AdminPanel />
 * </ProtectedContent>
 *
 * OR
 *
 * <ProtectedContent minRole={UserRole.PROGRAM_MANAGER}>
 *   <ManagerFeatures />
 * </ProtectedContent>
 */
export function ProtectedContent({
  children,
  allowedRoles,
  minRole,
  fallback = null,
}: ProtectedContentProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <>{fallback}</>
  }

  // Check specific roles
  if (allowedRoles && !userHasAnyRole(user.role, allowedRoles)) {
    return <>{fallback}</>
  }

  // Check minimum role level
  if (minRole && !userHasRole(user.role, minRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
