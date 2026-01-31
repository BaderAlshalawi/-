import { UserRole } from '@/types'
import { getRoleDisplayName, getRoleColor } from '@/lib/rbac'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
        role
      )} ${className}`}
    >
      {getRoleDisplayName(role)}
    </span>
  )
}
