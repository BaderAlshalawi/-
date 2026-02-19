import { describe, it, expect } from 'vitest'
import {
  computeHourlyCostFromMonthly,
  computeAllRatesFromMonthly,
  normalizeUtilization,
  computeAllocationCosts,
  COSTING_DEFAULTS,
  getHoursPerMonth,
} from '@/lib/resource-costing'

describe('resource-costing', () => {
  describe('COSTING_DEFAULTS', () => {
    it('has 22 working days per month', () => {
      expect(COSTING_DEFAULTS.workingDaysPerMonth).toBe(22)
    })
    it('has 8 hours per day', () => {
      expect(COSTING_DEFAULTS.hoursPerDay).toBe(8)
    })
    it('has SAR as default currency', () => {
      expect(COSTING_DEFAULTS.currency).toBe('SAR')
    })
  })

  describe('getHoursPerMonth', () => {
    it('returns 176 for default config (22 * 8)', () => {
      expect(getHoursPerMonth()).toBe(176)
    })
    it('supports custom config', () => {
      expect(getHoursPerMonth({ workingDaysPerMonth: 20, hoursPerDay: 7 })).toBe(140)
    })
  })

  describe('computeHourlyCostFromMonthly', () => {
    it('computes daily and hourly from monthly cost (36000 SAR)', () => {
      const result = computeHourlyCostFromMonthly(36000)
      expect(result.daily).toBeCloseTo(1636.36, 1)
      expect(result.hourly).toBeCloseTo(204.55, 1)
    })

    it('computes for Lead monthly cost (69002 SAR)', () => {
      const result = computeHourlyCostFromMonthly(69002)
      expect(result.daily).toBeCloseTo(3136.45, 0)
      expect(result.hourly).toBeCloseTo(392.06, 0)
    })

    it('returns 0 for zero monthly cost', () => {
      const result = computeHourlyCostFromMonthly(0)
      expect(result.daily).toBe(0)
      expect(result.hourly).toBe(0)
    })
  })

  describe('computeAllRatesFromMonthly', () => {
    it('returns monthly, daily, hourly', () => {
      const result = computeAllRatesFromMonthly(36000)
      expect(result.monthly).toBe(36000)
      expect(result.daily).toBeCloseTo(1636.36, 1)
      expect(result.hourly).toBeCloseTo(204.55, 1)
    })
  })

  describe('normalizeUtilization', () => {
    it('returns 0 for negative values', () => {
      expect(normalizeUtilization(-5)).toBe(0)
    })
    it('returns value as-is when 0 <= value <= 1', () => {
      expect(normalizeUtilization(0)).toBe(0)
      expect(normalizeUtilization(0.5)).toBe(0.5)
      expect(normalizeUtilization(1)).toBe(1)
    })
    it('converts percentage to fraction when value > 1', () => {
      expect(normalizeUtilization(50)).toBe(0.5)
      expect(normalizeUtilization(100)).toBe(1)
      expect(normalizeUtilization(33)).toBe(0.33)
    })
  })

  describe('computeAllocationCosts', () => {
    it('matches Excel: actualCost = hourly * hours * utilization', () => {
      const result = computeAllocationCosts({
        hourlyCost: 204.55,
        actualHours: 400,
        utilization: 0.5,
      })
      expect(result.actualCost).toBeCloseTo(40910, 0)
    })

    it('computes duration = hours / 8 (ignores utilization)', () => {
      const result = computeAllocationCosts({
        hourlyCost: 200,
        actualHours: 160,
        utilization: 0.5,
      })
      expect(result.durationDays).toBe(20)
    })

    it('handles 100% utilization', () => {
      const result = computeAllocationCosts({
        hourlyCost: 204.55,
        actualHours: 160,
        utilization: 100,
      })
      expect(result.actualCost).toBeCloseTo(204.55 * 160, 0)
      expect(result.durationDays).toBe(20)
    })

    it('handles 0 hours', () => {
      const result = computeAllocationCosts({
        hourlyCost: 200,
        actualHours: 0,
        utilization: 1,
      })
      expect(result.actualCost).toBe(0)
      expect(result.durationDays).toBe(0)
    })

    it('handles custom hoursPerDay', () => {
      const result = computeAllocationCosts({
        hourlyCost: 200,
        actualHours: 70,
        utilization: 1,
        hoursPerDay: 7,
      })
      expect(result.durationDays).toBe(10)
    })

    it('matches Excel row: Surplus Drugs / Development / Business / Sr.Lead', () => {
      // monthly 75604, hourly = 75604 / 22 / 8 = 429.57
      const hourly = Math.round((75604 / 22 / 8) * 100) / 100
      const result = computeAllocationCosts({
        hourlyCost: hourly,
        actualHours: 100,
        utilization: 0.5,
      })
      expect(result.actualCost).toBeCloseTo(21478.41, 0)
      expect(result.durationDays).toBe(12.5)
    })

    it('matches Excel row: Surplus Drugs / Dev / Technical / Senior Frontend Dev', () => {
      // monthly 36000, hourly = 36000 / 22 / 8 = 204.55
      const hourly = Math.round((36000 / 22 / 8) * 100) / 100
      const result = computeAllocationCosts({
        hourlyCost: hourly,
        actualHours: 80,
        utilization: 1.0,
      })
      expect(result.actualCost).toBeCloseTo(16364, 0)
      expect(result.durationDays).toBe(10)
    })
  })
})
