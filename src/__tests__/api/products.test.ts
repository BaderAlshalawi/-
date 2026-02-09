import { describe, it, expect, beforeAll } from 'vitest'
import { GET, POST } from '@/app/api/products/route'
import { GET as GetPortfolios } from '@/app/api/portfolios/route'
import { POST as LoginPOST } from '@/app/api/auth/login/route'
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

describe.skipIf(skipDb)('API - Products', () => {
  let authToken: string
  let portfolioId: string

  beforeAll(async () => {
    const loginRes = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'superadmin@lean.com',
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
    const portfoliosData = await portfoliosRes.json()
    const list = portfoliosData.portfolios || []
    portfolioId = list[0]?.id
  })

  it('GET /api/products — should return products list', async () => {
    const res = await GET(
      nextRequest('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(200)
  })

  it('POST /api/products — should create a product under a portfolio', async () => {
    if (!portfolioId) return

    const res = await POST(
      nextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Product ' + Date.now(),
          code: 'TP' + Date.now().toString().slice(-4),
          description: 'Automated test product',
          portfolioId,
          valueProposition: 'Testing automation',
          targetClient: 'QA Team',
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.governanceState).toBe('DRAFT')
  })

  it('POST /api/products — should reject product without portfolioId', async () => {
    const res = await POST(
      nextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Missing Portfolio',
          description: 'Should fail',
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect([400, 422]).toContain(res.status)
  })
})
