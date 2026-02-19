import { describe, it, expect } from 'vitest'
import { GovernanceState, FeatureState } from '@/types'

const portfolioValidTransitions: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['LOCKED', 'ARCHIVED'],
  REJECTED: ['SUBMITTED'],
  LOCKED: ['APPROVED'],
  ARCHIVED: [],
}

const featureValidTransitions: Record<string, string[]> = {
  DISCOVERY: ['READY'],
  READY: ['IN_PROGRESS', 'DISCOVERY'],
  IN_PROGRESS: ['RELEASED', 'READY'],
  RELEASED: ['ARCHIVED'],
  ARCHIVED: [],
}

describe('Governance State Machine — Portfolio', () => {
  it('DRAFT should only transition to SUBMITTED', () => {
    expect(portfolioValidTransitions.DRAFT).toEqual(['SUBMITTED'])
  })

  it('SUBMITTED should transition to APPROVED or REJECTED', () => {
    expect(portfolioValidTransitions.SUBMITTED).toContain('APPROVED')
    expect(portfolioValidTransitions.SUBMITTED).toContain('REJECTED')
  })

  it('REJECTED should be resubmittable', () => {
    expect(portfolioValidTransitions.REJECTED).toContain('SUBMITTED')
  })

  it('ARCHIVED should have no transitions', () => {
    expect(portfolioValidTransitions.ARCHIVED).toEqual([])
  })

  it('all GovernanceState values should be covered', () => {
    for (const state of Object.values(GovernanceState)) {
      expect(portfolioValidTransitions).toHaveProperty(state)
    }
  })
})

describe('Feature State Machine', () => {
  it('DISCOVERY -> READY', () => {
    expect(featureValidTransitions.DISCOVERY).toEqual(['READY'])
  })

  it('READY can go back to DISCOVERY or forward to IN_PROGRESS', () => {
    expect(featureValidTransitions.READY).toContain('IN_PROGRESS')
    expect(featureValidTransitions.READY).toContain('DISCOVERY')
  })

  it('IN_PROGRESS can go to RELEASED or back to READY', () => {
    expect(featureValidTransitions.IN_PROGRESS).toContain('RELEASED')
    expect(featureValidTransitions.IN_PROGRESS).toContain('READY')
  })

  it('RELEASED -> ARCHIVED only', () => {
    expect(featureValidTransitions.RELEASED).toEqual(['ARCHIVED'])
  })

  it('ARCHIVED is terminal', () => {
    expect(featureValidTransitions.ARCHIVED).toEqual([])
  })

  it('all FeatureState values should be covered', () => {
    for (const state of Object.values(FeatureState)) {
      expect(featureValidTransitions).toHaveProperty(state)
    }
  })
})
