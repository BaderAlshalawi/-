import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from './prisma'

export const COSTING_DEFAULTS = {
  workingDaysPerMonth: 22,
  hoursPerDay: 8,
  currency: 'SAR',
} as const

export interface CostingConfig {
  workingDaysPerMonth: number
  hoursPerDay: number
}

export function getHoursPerMonth(config: CostingConfig = COSTING_DEFAULTS): number {
  return config.workingDaysPerMonth * config.hoursPerDay
}

export function computeHourlyCostFromMonthly(
  monthlyCost: number,
  config: CostingConfig = COSTING_DEFAULTS
): { daily: number; hourly: number } {
  const daily = monthlyCost / config.workingDaysPerMonth
  const hourly = daily / config.hoursPerDay
  return { daily: Math.round(daily * 100) / 100, hourly: Math.round(hourly * 100) / 100 }
}

export function computeAllRatesFromMonthly(
  monthlyCost: number,
  config: CostingConfig = COSTING_DEFAULTS
): { monthly: number; daily: number; hourly: number } {
  const { daily, hourly } = computeHourlyCostFromMonthly(monthlyCost, config)
  return { monthly: monthlyCost, daily, hourly }
}

/**
 * utilization is stored as a decimal 0–1 (e.g. 0.5 = 50%).
 * If the input looks like a percentage (> 1), normalise it.
 */
export function normalizeUtilization(value: number): number {
  if (value < 0) return 0
  if (value > 1) return value / 100
  return value
}

export interface AllocationCostInput {
  hourlyCost: number
  actualHours: number
  utilization: number // 0–1 after normalisation
  hoursPerDay?: number
}

export interface AllocationCostResult {
  actualCost: number
  durationDays: number
}

export function computeAllocationCosts(input: AllocationCostInput): AllocationCostResult {
  const hoursPerDay = input.hoursPerDay ?? COSTING_DEFAULTS.hoursPerDay
  const util = normalizeUtilization(input.utilization)
  const actualCost = Math.round(input.hourlyCost * input.actualHours * util * 100) / 100
  const durationDays = Math.round((input.actualHours / hoursPerDay) * 100) / 100
  return { actualCost, durationDays }
}

export async function lookupHourlyCost(
  teamTypeId: string,
  gradeRoleId: string
): Promise<number | null> {
  const card = await prisma.rateCard.findFirst({
    where: {
      teamTypeId,
      gradeRoleId,
      isActive: true,
    },
    orderBy: { effectiveFrom: 'desc' },
    select: { hourlyCost: true },
  })
  if (!card) return null
  return Number(card.hourlyCost)
}

export async function computePortfolioLaborTotal(portfolioId: string): Promise<number> {
  const result = await prisma.portfolioResourceAllocation.aggregate({
    where: { portfolioId },
    _sum: { actualCostComputed: true },
  })
  return Number(result._sum.actualCostComputed ?? 0)
}

export async function computePortfolioHostingTotal(portfolioId: string): Promise<number> {
  const result = await prisma.hostingCost.aggregate({
    where: { portfolioId },
    _sum: { amount: true },
  })
  return Number(result._sum.amount ?? 0)
}

export async function computePortfolioFinancialSummary(portfolioId: string) {
  const [laborTotal, hostingTotal, portfolio] = await Promise.all([
    computePortfolioLaborTotal(portfolioId),
    computePortfolioHostingTotal(portfolioId),
    prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { estimatedBudget: true, costCurrency: true },
    }),
  ])

  const totalCost = laborTotal + hostingTotal
  const estimatedBudget = portfolio?.estimatedBudget ? Number(portfolio.estimatedBudget) : null
  const variance = estimatedBudget != null ? estimatedBudget - totalCost : null

  return {
    laborCostTotal: laborTotal,
    hostingCostTotal: hostingTotal,
    portfolioTotalCost: totalCost,
    estimatedBudget,
    variance,
    currency: portfolio?.costCurrency ?? 'SAR',
  }
}

export async function getPortfolioCostBreakdowns(portfolioId: string) {
  const allocations = await prisma.portfolioResourceAllocation.findMany({
    where: { portfolioId },
    include: {
      phase: { select: { name: true } },
      teamType: { select: { name: true } },
      feature: { select: { name: true } },
      quarter: { select: { name: true } },
      gradeRole: { select: { name: true } },
    },
  })

  const byPhase: Record<string, number> = {}
  const byTeamType: Record<string, number> = {}
  const byFeature: Record<string, number> = {}
  const byQuarter: Record<string, number> = {}
  const byGradeRole: Record<string, number> = {}

  for (const a of allocations) {
    const cost = Number(a.actualCostComputed)
    const phaseName = a.phase.name
    const teamName = a.teamType.name
    const featureName = a.feature?.name ?? 'Unassigned'
    const quarterName = a.quarter?.name ?? 'N/A'
    const gradeName = a.gradeRole.name

    byPhase[phaseName] = (byPhase[phaseName] ?? 0) + cost
    byTeamType[teamName] = (byTeamType[teamName] ?? 0) + cost
    byFeature[featureName] = (byFeature[featureName] ?? 0) + cost
    byQuarter[quarterName] = (byQuarter[quarterName] ?? 0) + cost
    byGradeRole[gradeName] = (byGradeRole[gradeName] ?? 0) + cost
  }

  const hostingCosts = await prisma.hostingCost.findMany({
    where: { portfolioId },
  })

  const hostingByCategory: Record<string, number> = {}
  for (const h of hostingCosts) {
    hostingByCategory[h.category] = (hostingByCategory[h.category] ?? 0) + Number(h.amount)
  }

  return { byPhase, byTeamType, byFeature, byQuarter, byGradeRole, hostingByCategory }
}
