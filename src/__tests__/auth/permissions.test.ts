import { describe, it, expect } from 'vitest'
import { canPerform } from '@/lib/permissions'
import { UserRole } from '@/types'
import type { User } from '@/types'

const skipDb = process.env.SKIP_DB_TESTS === '1'

function mockUser(role: UserRole, assignedPortfolioId?: string | null): User {
  return {
    id: 'test-id',
    email: 'test@test.com',
    name: 'Test',
    role,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedPortfolioId: assignedPortfolioId ?? null,
  }
}

describe.skipIf(skipDb)('RBAC - Role-Based Access Control', () => {
  describe('SUPER_ADMIN permissions', () => {
    it('should have access to portfolio create', async () => {
      const user = mockUser(UserRole.SUPER_ADMIN)
      expect(await canPerform(user, 'portfolio:create')).toBe(true)
    })

    it('should have access to user management', async () => {
      const user = mockUser(UserRole.SUPER_ADMIN)
      expect(await canPerform(user, 'user:create')).toBe(true)
    })

    it('should have access to system freeze', async () => {
      const user = mockUser(UserRole.SUPER_ADMIN)
      expect(await canPerform(user, 'system:freeze')).toBe(true)
    })
  })

  describe('VIEWER permissions', () => {
    it('should have cost view but not create', async () => {
      const user = mockUser(UserRole.VIEWER)
      expect(await canPerform(user, 'cost:view')).toBe(true)
      expect(await canPerform(user, 'cost:create')).toBe(false)
    })

    it('should not create portfolios', async () => {
      const user = mockUser(UserRole.VIEWER)
      expect(await canPerform(user, 'portfolio:create')).toBe(false)
    })
  })

  describe('ADMIN permissions', () => {
    it('should manage users but not create portfolios', async () => {
      const user = mockUser(UserRole.ADMIN)
      expect(await canPerform(user, 'user:create')).toBe(true)
      expect(await canPerform(user, 'portfolio:create')).toBe(false)
    })
  })

  describe('PROGRAM_MANAGER permissions', () => {
    it('should create products only when assigned to portfolio', async () => {
      const user = mockUser(UserRole.PROGRAM_MANAGER, 'portfolio-123')
      expect(
        await canPerform(user, 'product:create', { portfolioId: 'portfolio-123' })
      ).toBe(true)
      expect(
        await canPerform(user, 'product:create', { portfolioId: 'other-id' })
      ).toBe(false)
    })
  })

  describe('PRODUCT_MANAGER permissions', () => {
    it('should not create portfolios', async () => {
      const user = mockUser(UserRole.PRODUCT_MANAGER)
      expect(await canPerform(user, 'portfolio:create')).toBe(false)
    })
  })

  describe('CONTRIBUTOR permissions', () => {
    it('should not create products', async () => {
      const user = mockUser(UserRole.CONTRIBUTOR)
      expect(
        await canPerform(user, 'product:create', { portfolioId: 'any-id' })
      ).toBe(false)
    })
  })
})
