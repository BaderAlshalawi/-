import type { User } from '@/types'
import { UserRole } from '@/types'
import { prisma } from './prisma'
import { getSystemConfig } from './system'

/** Minimal user shape needed for permission checks (e.g. from getCurrentUser) */
export type UserLike = Pick<User, 'id' | 'role' | 'assignedPortfolioId'>

export type Permission =
  | 'portfolio:create' | 'portfolio:edit' | 'portfolio:submit' | 'portfolio:approve' | 'portfolio:lock' | 'portfolio:archive'
  | 'product:create' | 'product:edit' | 'product:submit' | 'product:approve' | 'product:lock' | 'product:archive'
  | 'feature:create' | 'feature:edit' | 'feature:transition' | 'feature:archive'
  | 'release:create' | 'release:edit' | 'release:submit-go-nogo' | 'release:approve-go' | 'release:lock'
  | 'document:upload' | 'document:delete'
  | 'cost:create' | 'cost:edit' | 'cost:delete' | 'cost:view'
  | 'user:create' | 'user:edit' | 'user:deactivate' | 'user:assign'
  | 'audit:view'
  | 'system:freeze'

interface PermissionContext {
  portfolioId?: string
  productId?: string
  featureId?: string
  releaseId?: string
}

export async function canPerform(
  user: UserLike,
  permission: Permission,
  context?: PermissionContext
): Promise<boolean> {
  const { role } = user

  // Super Admin can do everything
  if (role === UserRole.SUPER_ADMIN) return true

  // Check system freeze (except Super Admin)
  const systemFrozen = await isSystemFrozen()
  if (systemFrozen) return false

  switch (permission) {
    // PORTFOLIO PERMISSIONS
    case 'portfolio:create':
      return false // Only Super Admin

    case 'portfolio:edit':
    case 'portfolio:submit':
    case 'portfolio:approve':
    case 'portfolio:lock':
      if (role !== 'PROGRAM_MANAGER') return false
      return user.assignedPortfolioId === context?.portfolioId

    case 'portfolio:archive':
      return false // Only Super Admin

    // PRODUCT PERMISSIONS
    case 'product:create':
      if (role !== 'PROGRAM_MANAGER') return false
      if (!context?.portfolioId) return false
      return user.assignedPortfolioId === context.portfolioId

    case 'product:edit':
      if (role === 'PROGRAM_MANAGER') {
        if (!context?.productId) return false
        const product = await prisma.product.findUnique({
          where: { id: context.productId },
          select: { portfolioId: true },
        })
        return !!(product?.portfolioId && user.assignedPortfolioId === product.portfolioId)
      }
      if (role === 'PRODUCT_MANAGER') {
        if (!context?.productId) return false
        return await isAssignedToProduct(user.id, context.productId)
      }
      return false

    case 'product:submit':
      if (role !== 'PRODUCT_MANAGER') return false
      if (!context?.productId) return false
      return await isAssignedToProduct(user.id, context.productId)

    case 'product:approve':
      if (role !== 'PROGRAM_MANAGER') return false
      if (!context?.productId) return false
      const product = await prisma.product.findUnique({
        where: { id: context.productId },
        select: { portfolioId: true },
      })
      return !!(product?.portfolioId && user.assignedPortfolioId === product.portfolioId)

    case 'product:lock':
      if (role !== 'PROGRAM_MANAGER') return false
      if (!context?.productId) return false
      const productForLock = await prisma.product.findUnique({
        where: { id: context.productId },
        select: { portfolioId: true },
      })
      return !!(productForLock?.portfolioId && user.assignedPortfolioId === productForLock.portfolioId)

    // FEATURE PERMISSIONS
    case 'feature:create':
      if (role !== 'PRODUCT_MANAGER') return false
      if (!context?.productId) return false
      return await isAssignedToProduct(user.id, context.productId)

    case 'feature:edit':
      if (role === 'PRODUCT_MANAGER') {
        if (!context?.featureId) return false
        const feature = await prisma.feature.findUnique({
          where: { id: context.featureId },
          select: { productId: true },
        })
        if (!feature?.productId) return false
        return await isAssignedToProduct(user.id, feature.productId)
      }
      if (role === 'CONTRIBUTOR') {
        if (!context?.featureId) return false
        const feature = await prisma.feature.findUnique({
          where: { id: context.featureId },
          select: { state: true },
        })
        const isAssigned = await isAssignedToFeature(user.id, context.featureId)
        return isAssigned && feature?.state === 'IN_PROGRESS'
      }
      return false

    case 'feature:transition':
      if (role !== 'PRODUCT_MANAGER') return false
      if (!context?.featureId) return false
      const featureForTransition = await prisma.feature.findUnique({
        where: { id: context.featureId },
        select: { productId: true },
      })
      if (!featureForTransition?.productId) return false
      return await isAssignedToProduct(user.id, featureForTransition.productId)

    // RELEASE PERMISSIONS
    case 'release:create':
    case 'release:edit':
    case 'release:submit-go-nogo':
    case 'release:lock':
      if (role !== 'PRODUCT_MANAGER') return false
      if (!context?.releaseId && !context?.productId) return false
      if (context.releaseId) {
        const release = await prisma.release.findUnique({
          where: { id: context.releaseId },
          select: { productId: true },
        })
        if (!release?.productId) return false
        return await isAssignedToProduct(user.id, release.productId)
      }
      if (context.productId) {
        return await isAssignedToProduct(user.id, context.productId)
      }
      return false

    // COST
    case 'cost:view':
      return true // any authenticated user can view costs for entities they can see
    case 'cost:create':
    case 'cost:edit':
    case 'cost:delete':
      return role !== UserRole.VIEWER

    // USER MANAGEMENT
    case 'user:create':
    case 'user:edit':
    case 'user:deactivate':
    case 'user:assign':
      return role === UserRole.ADMIN

    // AUDIT
    case 'audit:view':
      return role === UserRole.ADMIN

    // SYSTEM
    case 'system:freeze':
      return false // Only Super Admin

    // DOCUMENTS
    case 'document:upload':
    case 'document:delete':
      return role !== 'VIEWER'

    default:
      return false
  }
}

async function isAssignedToProduct(userId: string, productId: string): Promise<boolean> {
  const assignment = await prisma.productManagerAssignment.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  })
  return !!assignment
}

async function isAssignedToFeature(userId: string, featureId: string): Promise<boolean> {
  const assignment = await prisma.featureContributorAssignment.findUnique({
    where: {
      userId_featureId: {
        userId,
        featureId,
      },
    },
  })
  return !!assignment
}

async function isSystemFrozen(): Promise<boolean> {
  const config = await getSystemConfig('system_frozen')
  if (!config?.value) return false
  if (typeof config.value === 'object' && config.value !== null && !Array.isArray(config.value)) {
    return (config.value as { frozen?: boolean })?.frozen === true
  }
  return false
}
