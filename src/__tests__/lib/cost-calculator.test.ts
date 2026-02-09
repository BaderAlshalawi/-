import { describe, it, expect } from 'vitest'

describe('Cost Calculator', () => {
  it('should calculate total cost from entries', () => {
    const entries = [
      { amount: 1000, category: 'LABOR' },
      { amount: 500, category: 'INFRASTRUCTURE' },
      { amount: 250, category: 'LICENSING' },
    ]
    const total = entries.reduce((sum, e) => sum + e.amount, 0)
    expect(total).toBe(1750)
  })

  it('should handle empty cost entries', () => {
    const entries: { amount: number }[] = []
    const total = entries.reduce((sum, e) => sum + e.amount, 0)
    expect(total).toBe(0)
  })

  it('should calculate budget utilization percentage', () => {
    const budget = 100000
    const spent = 75000
    const utilization = (spent / budget) * 100
    expect(utilization).toBe(75)
  })
})
