import { describe, it, expect } from 'vitest'
import { hasRole, hasAnyRole, getRoleDisplayName, getRoleColor, userHasMinRole } from '@/lib/rbac'
import { UserRole } from '@/types'

describe('RBAC — Role Hierarchy', () => {
  it('SUPER_ADMIN should satisfy any role requirement', () => {
    expect(hasRole(UserRole.SUPER_ADMIN, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.SUPER_ADMIN, UserRole.PRODUCT_MANAGER)).toBe(true)
    expect(hasRole(UserRole.SUPER_ADMIN, UserRole.PROGRAM_MANAGER)).toBe(true)
    expect(hasRole(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(true)
  })

  it('VIEWER should only satisfy VIEWER requirement', () => {
    expect(hasRole(UserRole.VIEWER, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.VIEWER, UserRole.PRODUCT_MANAGER)).toBe(false)
    expect(hasRole(UserRole.VIEWER, UserRole.PROGRAM_MANAGER)).toBe(false)
    expect(hasRole(UserRole.VIEWER, UserRole.SUPER_ADMIN)).toBe(false)
  })

  it('PRODUCT_MANAGER should satisfy VIEWER and PRODUCT_MANAGER', () => {
    expect(hasRole(UserRole.PRODUCT_MANAGER, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.PRODUCT_MANAGER, UserRole.PRODUCT_MANAGER)).toBe(true)
    expect(hasRole(UserRole.PRODUCT_MANAGER, UserRole.PROGRAM_MANAGER)).toBe(false)
  })

  it('PROGRAM_MANAGER should satisfy VIEWER, PM, and PROGRAM_MANAGER', () => {
    expect(hasRole(UserRole.PROGRAM_MANAGER, UserRole.VIEWER)).toBe(true)
    expect(hasRole(UserRole.PROGRAM_MANAGER, UserRole.PRODUCT_MANAGER)).toBe(true)
    expect(hasRole(UserRole.PROGRAM_MANAGER, UserRole.PROGRAM_MANAGER)).toBe(true)
    expect(hasRole(UserRole.PROGRAM_MANAGER, UserRole.SUPER_ADMIN)).toBe(false)
  })
})

describe('RBAC — hasAnyRole', () => {
  it('returns true when role is in the allowed list', () => {
    expect(hasAnyRole(UserRole.VIEWER, [UserRole.VIEWER, UserRole.PRODUCT_MANAGER])).toBe(true)
  })

  it('returns false when role is not in the allowed list', () => {
    expect(hasAnyRole(UserRole.VIEWER, [UserRole.PRODUCT_MANAGER, UserRole.SUPER_ADMIN])).toBe(false)
  })
})

describe('RBAC — userHasMinRole', () => {
  it('should work correctly for min role checks', () => {
    expect(userHasMinRole(UserRole.SUPER_ADMIN, UserRole.PROGRAM_MANAGER)).toBe(true)
    expect(userHasMinRole(UserRole.VIEWER, UserRole.PROGRAM_MANAGER)).toBe(false)
  })
})

describe('RBAC — Display helpers', () => {
  it('returns correct display names', () => {
    expect(getRoleDisplayName(UserRole.SUPER_ADMIN)).toBe('Super Administrator')
    expect(getRoleDisplayName(UserRole.PROGRAM_MANAGER)).toBe('Program Manager')
    expect(getRoleDisplayName(UserRole.PRODUCT_MANAGER)).toBe('Product Manager')
    expect(getRoleDisplayName(UserRole.VIEWER)).toBe('Viewer')
  })

  it('returns correct colors', () => {
    expect(getRoleColor(UserRole.SUPER_ADMIN)).toContain('purple')
    expect(getRoleColor(UserRole.PROGRAM_MANAGER)).toContain('blue')
    expect(getRoleColor(UserRole.PRODUCT_MANAGER)).toContain('green')
    expect(getRoleColor(UserRole.VIEWER)).toContain('gray')
  })

  it('returns only 4 roles in UserRole enum', () => {
    const roles = Object.values(UserRole)
    expect(roles).toHaveLength(4)
    expect(roles).toContain('SUPER_ADMIN')
    expect(roles).toContain('PROGRAM_MANAGER')
    expect(roles).toContain('PRODUCT_MANAGER')
    expect(roles).toContain('VIEWER')
    expect(roles).not.toContain('ADMIN')
    expect(roles).not.toContain('CONTRIBUTOR')
  })
})
