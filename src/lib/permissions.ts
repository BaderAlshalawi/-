import type { User } from '@/types'
import { UserRole } from '@/types'
import { prisma } from './prisma'
import { getSystemConfig } from './system'

/** Minimal user shape needed for permission checks */
export type UserLike = Pick<User, 'id' | 'role' | 'assignedPortfolioId'>

export type Permission =
  | 'portfolio:create' | 'portfolio:edit' | 'portfolio:submit' | 'portfolio:approve' | 'portfolio:reject' | 'portfolio:lock' | 'portfolio:unlock' | 'portfolio:archive'
  | 'product:create' | 'product:edit' | 'product:submit' | 'product:approve' | 'product:reject' | 'product:lock' | 'product:archive'
  | 'feature:create' | 'feature:edit' | 'feature:transition' | 'feature:archive'
  | 'release:create' | 'release:edit' | 'release:submit-go-nogo' | 'release:decide-go-nogo' | 'release:lock'
  | 'document:upload' | 'document:delete'
  | 'cost:create' | 'cost:edit' | 'cost:delete' | 'cost:view'
  | 'user:create' | 'user:edit' | 'user:deactivate' | 'user:assign'
  | 'audit:view' | 'audit:export'
  | 'system:freeze'
  | 'resource:manage' | 'resource:view-utilisation' | 'resource:create-assignment' | 'resource:delete-assignment'

interface PermissionContext {
  portfolioId?: string
  productId?: string
  featureId?: string
  releaseId?: string
}

/**
 * BRD v3.0 Permission Engine
 * Four-role model: SUPER_ADMIN, PROGRAM_MANAGER, PRODUCT_MANAGER, VIEWER
 * ADMIN and CONTRIBUTOR roles permanently removed.
 */
export async function canPerform(
  user: UserLike,
  permission: Permission,
  context?: PermissionContext
): Promise<boolean> {
  const { role } = user

  // SUPER_ADMIN has full authority across all modules
  if (role === UserRole.SUPER_ADMIN) return true

  // Check system freeze (all non-SUPER_ADMIN writes blocked when frozen)
  const writePermissions: Permission[] = [
    'portfolio:create', 'portfolio:edit', 'portfolio:submit', 'portfolio:approve', 'portfolio:reject',
    'portfolio:lock', 'portfolio:unlock', 'portfolio:archive',
    'product:create', 'product:edit', 'product:submit', 'product:approve', 'product:reject', 'product:lock',
    'feature:create', 'feature:edit', 'feature:transition',
    'release:create', 'release:edit', 'release:submit-go-nogo', 'release:decide-go-nogo', 'release:lock',
    'document:upload', 'document:delete',
    'cost:create', 'cost:edit', 'cost:delete',
    'user:create', 'user:edit', 'user:deactivate', 'user:assign',
    'system:freeze', 'resource:manage', 'resource:create-assignment', 'resource:delete-assignment',
  ]

  if (writePermissions.includes(permission)) {
    const systemFrozen = await isSystemFrozen()
    if (systemFrozen) return false
  }

  switch (permission) {
    // ── PORTFOLIO PERMISSIONS ──
    case 'portfolio:create':
    case 'portfolio:archive':
    case 'portfolio:approve':
    case 'portfolio:reject':
      return false // SUPER_ADMIN only (already handled above)

    case 'portfolio:edit':
    case 'portfolio:submit':
      if (role !== UserRole.PROGRAM_MANAGER) return false
      return user.assignedPortfolioId === context?.portfolioId

    case 'portfolio:lock':
    case 'portfolio:unlock':
      if (role !== UserRole.PROGRAM_MANAGER) return false
      return user.assignedPortfolioId === context?.portfolioId

    // ── PRODUCT PERMISSIONS ──
    case 'product:create':
      if (role !== UserRole.PROGRAM_MANAGER) return false
      if (!context?.portfolioId) return false
      return user.assignedPortfolioId === context.portfolioId

    case 'product:edit':
      if (role === UserRole.PROGRAM_MANAGER) {
        if (!context?.productId) return false
        const product = await prisma.product.findUnique({
          where: { id: context.productId },
          select: { portfolioId: true },
        })
        return !!(product?.portfolioId && user.assignedPortfolioId === product.portfolioId)
      }
      if (role === UserRole.PRODUCT_MANAGER) {
        if (!context?.productId) return false
        return await isAssignedToProduct(user.id, context.productId)
      }
      return false

    case 'product:submit':
      if (role !== UserRole.PRODUCT_MANAGER) return false
      if (!context?.productId) return false
      return await isAssignedToProduct(user.id, context.productId)

    case 'product:approve':
    case 'product:reject':
    case 'product:lock':
      if (role !== UserRole.PROGRAM_MANAGER) return false
      if (!context?.productId) return false
      const productForApproval = await prisma.product.findUnique({
        where: { id: context.productId },
        select: { portfolioId: true },
      })
      return !!(productForApproval?.portfolioId && user.assignedPortfolioId === productForApproval.portfolioId)

    // ── FEATURE PERMISSIONS ──
    case 'feature:create':
    case 'feature:transition':
      if (role !== UserRole.PRODUCT_MANAGER) return false
      if (context?.featureId) {
        const feature = await prisma.feature.findUnique({
          where: { id: context.featureId },
          select: { productId: true },
        })
        if (!feature?.productId) return false
        return await isAssignedToProduct(user.id, feature.productId)
      }
      if (!context?.productId) return false
      return await isAssignedToProduct(user.id, context.productId)

    case 'feature:edit':
      if (role !== UserRole.PRODUCT_MANAGER) return false
      if (!context?.featureId) return false
      const featureForEdit = await prisma.feature.findUnique({
        where: { id: context.featureId },
        select: { productId: true, state: true },
      })
      if (!featureForEdit?.productId) return false
      if (featureForEdit.state === 'ARCHIVED') return false
      return await isAssignedToProduct(user.id, featureForEdit.productId)

    // ── RELEASE PERMISSIONS ──
    case 'release:create':
    case 'release:edit':
    case 'release:submit-go-nogo':
    case 'release:lock':
      if (role !== UserRole.PRODUCT_MANAGER) return false
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

    case 'release:decide-go-nogo':
      // Program Manager or SUPER_ADMIN only (SUPER_ADMIN handled above)
      if (role !== UserRole.PROGRAM_MANAGER) return false
      if (!context?.releaseId) return false
      const releaseForDecision = await prisma.release.findUnique({
        where: { id: context.releaseId },
        select: { product: { select: { portfolioId: true } } },
      })
      return !!(releaseForDecision?.product?.portfolioId && user.assignedPortfolioId === releaseForDecision.product.portfolioId)

    // ── COST ──
    case 'cost:view':
      return role !== UserRole.VIEWER
    case 'cost:create':
    case 'cost:edit':
    case 'cost:delete':
      return role !== UserRole.VIEWER

    // ── USER MANAGEMENT (SUPER_ADMIN only) ──
    case 'user:create':
    case 'user:edit':
    case 'user:deactivate':
    case 'user:assign':
      return false // SUPER_ADMIN only

    // ── AUDIT (SUPER_ADMIN only) ──
    case 'audit:view':
    case 'audit:export':
      return false // SUPER_ADMIN only

    // ── SYSTEM (SUPER_ADMIN only) ──
    case 'system:freeze':
      return false // SUPER_ADMIN only

    // ── RESOURCES ──
    case 'resource:manage':
    case 'resource:delete-assignment':
      return false // SUPER_ADMIN only
    case 'resource:create-assignment':
      return role === UserRole.PRODUCT_MANAGER
    case 'resource:view-utilisation':
      return role === UserRole.PROGRAM_MANAGER || role === UserRole.PRODUCT_MANAGER

    // ── ARCHIVE (SUPER_ADMIN only) ──
    case 'product:archive':
    case 'feature:archive':
      return false // SUPER_ADMIN only

    // ── DOCUMENTS ──
    case 'document:upload':
    case 'document:delete':
      return role !== UserRole.VIEWER

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

async function isSystemFrozen(): Promise<boolean> {
  const config = await getSystemConfig('system_frozen')
  if (!config?.value) return false
  if (typeof config.value === 'object' && config.value !== null && !Array.isArray(config.value)) {
    return (config.value as { frozen?: boolean })?.frozen === true
  }
  return false
}
