import { Decimal } from '@prisma/client/runtime/library'
import { EntityType } from '@prisma/client'
import { prisma } from './prisma'

export type CostEntityType =
  | 'PORTFOLIO'
  | 'PRODUCT'
  | 'FEATURE'
  | 'RELEASE'

function toNumber(d: Decimal | null | undefined): number {
  if (d == null) return 0
  return typeof d === 'object' && 'toNumber' in d ? (d as Decimal).toNumber() : Number(d)
}

function toDecimal(n: number): Decimal {
  return new Decimal(n)
}

/**
 * Portfolio total cost = Sum of all child Products' actualCost
 */
export async function calculatePortfolioCost(portfolioId: string): Promise<Decimal> {
  const products = await prisma.product.findMany({
    where: { portfolioId },
    select: { actualCost: true },
  })
  const total = products.reduce((sum, p) => sum + toNumber(p.actualCost), 0)
  return toDecimal(total)
}

/**
 * Product total cost = Sum of all child Features' actualCost + direct Product cost entries
 */
export async function calculateProductCost(productId: string): Promise<Decimal> {
  const [features, directEntries] = await Promise.all([
    prisma.feature.findMany({
      where: { productId },
      select: { actualCost: true },
    }),
    prisma.costEntry.aggregate({
      where: {
        entityType: 'PRODUCT' as EntityType,
        entityId: productId,
      },
      _sum: { amount: true },
    }),
  ])
  const fromFeatures = features.reduce((sum, f) => sum + toNumber(f.actualCost), 0)
  const fromEntries = toNumber(directEntries._sum.amount)
  return toDecimal(fromFeatures + fromEntries)
}

/**
 * Feature total cost = Sum of all cost entries linked to that feature
 */
export async function calculateFeatureCost(featureId: string): Promise<Decimal> {
  const result = await prisma.costEntry.aggregate({
    where: {
      entityType: 'FEATURE' as EntityType,
      entityId: featureId,
    },
    _sum: { amount: true },
  })
  return toDecimal(toNumber(result._sum.amount))
}

/**
 * Release total cost = Sum of all Features in that release (their actualCost)
 */
export async function calculateReleaseCost(releaseId: string): Promise<Decimal> {
  const features = await prisma.feature.findMany({
    where: { releaseId },
    select: { actualCost: true },
  })
  const total = features.reduce((sum, f) => sum + toNumber(f.actualCost), 0)
  return toDecimal(total)
}

/**
 * Update stored actualCost for the given entity and optionally cascade to parents.
 * Uses a transaction to avoid race conditions.
 */
export async function updateCostRollups(
  entityType: CostEntityType,
  entityId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (entityType === 'FEATURE') {
      const cost = await calculateFeatureCostInTx(tx, entityId)
      await tx.feature.update({
        where: { id: entityId },
        data: { actualCost: cost },
      })
      const feature = await tx.feature.findUnique({
        where: { id: entityId },
        select: { productId: true },
      })
      if (feature?.productId) {
        await rollupProduct(tx, feature.productId)
      }
      return
    }

    if (entityType === 'PRODUCT') {
      await rollupProduct(tx, entityId)
      const product = await tx.product.findUnique({
        where: { id: entityId },
        select: { portfolioId: true },
      })
      if (product?.portfolioId) {
        await rollupPortfolio(tx, product.portfolioId)
      }
      return
    }

    if (entityType === 'RELEASE') {
      const cost = await calculateReleaseCostInTx(tx, entityId)
      await tx.release.update({
        where: { id: entityId },
        data: { actualCost: cost },
      })
      return
    }

    if (entityType === 'PORTFOLIO') {
      await rollupPortfolio(tx, entityId)
    }
  })
}

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function calculateFeatureCostInTx(
  tx: PrismaTx,
  featureId: string
): Promise<Decimal> {
  const result = await tx.costEntry.aggregate({
    where: {
      entityType: 'FEATURE' as EntityType,
      entityId: featureId,
    },
    _sum: { amount: true },
  })
  return toDecimal(toNumber(result._sum.amount))
}

async function calculateReleaseCostInTx(
  tx: PrismaTx,
  releaseId: string
): Promise<Decimal> {
  const features = await tx.feature.findMany({
    where: { releaseId },
    select: { actualCost: true },
  })
  const total = features.reduce((sum, f) => sum + toNumber(f.actualCost), 0)
  return toDecimal(total)
}

async function rollupProduct(tx: PrismaTx, productId: string): Promise<void> {
  const [features, directSum] = await Promise.all([
    tx.feature.findMany({
      where: { productId },
      select: { actualCost: true },
    }),
    tx.costEntry.aggregate({
      where: { entityType: 'PRODUCT' as EntityType, entityId: productId },
      _sum: { amount: true },
    }),
  ])
  const fromFeatures = features.reduce((sum, f) => sum + toNumber(f.actualCost), 0)
  const fromEntries = toNumber(directSum._sum.amount)
  const total = toDecimal(fromFeatures + fromEntries)
  await tx.product.update({
    where: { id: productId },
    data: { actualCost: total },
  })
}

async function rollupPortfolio(tx: PrismaTx, portfolioId: string): Promise<void> {
  const products = await tx.product.findMany({
    where: { portfolioId },
    select: { actualCost: true },
  })
  const total = products.reduce((sum, p) => sum + toNumber(p.actualCost), 0)
  await tx.portfolio.update({
    where: { id: portfolioId },
    data: { actualCost: toDecimal(total) },
  })
}
