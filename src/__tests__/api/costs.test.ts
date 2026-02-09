import { describe, it, expect, beforeAll } from 'vitest'
import { POST as LoginPOST } from '@/app/api/auth/login/route'
import { GET as GetPortfolios } from '@/app/api/portfolios/route'
import { GET as GetCostEntries, POST as PostCostEntry } from '@/app/api/cost-entries/route'
import { NextRequest } from 'next/server'

function nextRequest(
  url: string,
  opts: { method?: string; body?: string; headers?: Record<string, string> } = {}
) {
  const { method = 'GET', body, headers = {} } = opts
  return new NextRequest(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

const skipDb = process.env.SKIP_DB_TESTS === '1'

describe.skipIf(skipDb)('API - Cost Tracking', () => {
  let authToken: string
  let portfolioId: string

  beforeAll(async () => {
    const loginRes = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@lean.com',
          password: 'Admin@123',
        }),
      })
    )
    const loginData = await loginRes.json()
    authToken = loginData.token

    const portfoliosRes = await GetPortfolios(
      nextRequest('http://localhost:3000/api/portfolios', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    const data = await portfoliosRes.json()
    portfolioId = data.portfolios?.[0]?.id
  })

  it('POST /api/cost-entries — should create a cost entry', async () => {
    if (!portfolioId) return
    const res = await PostCostEntry(
      nextRequest('http://localhost:3000/api/cost-entries', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'PORTFOLIO',
          entityId: portfolioId,
          amount: 5000,
          category: 'LABOR',
          description: 'Development hours',
          date: new Date().toISOString().slice(0, 10),
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect([200, 201]).toContain(res.status)
  })

  it('GET /api/cost-entries — should return entries when entityType and entityId provided', async () => {
    if (!portfolioId) return
    const res = await GetCostEntries(
      nextRequest(
        `http://localhost:3000/api/cost-entries?entityType=PORTFOLIO&entityId=${portfolioId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
    )
    expect(res.status).toBe(200)
  })

  it('POST /api/cost-entries — should reject negative amounts', async () => {
    if (!portfolioId) return
    const res = await PostCostEntry(
      nextRequest('http://localhost:3000/api/cost-entries', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'PORTFOLIO',
          entityId: portfolioId,
          amount: -100,
          category: 'LABOR',
          description: 'Invalid',
          date: new Date().toISOString().slice(0, 10),
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect([400, 422]).toContain(res.status)
  })

  it('POST /api/cost-entries — should reject invalid category', async () => {
    if (!portfolioId) return
    const res = await PostCostEntry(
      nextRequest('http://localhost:3000/api/cost-entries', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'PORTFOLIO',
          entityId: portfolioId,
          amount: 100,
          category: 'INVALID_CATEGORY',
          description: 'Bad category',
          date: new Date().toISOString().slice(0, 10),
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect([400, 422]).toContain(res.status)
  })
})
