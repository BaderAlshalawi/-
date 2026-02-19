import { describe, it, expect, beforeAll } from 'vitest'
import { GET, POST } from '@/app/api/portfolios/route'
import { GET as GetById, PATCH, DELETE } from '@/app/api/portfolios/[id]/route'
import { GET as GetAnalytics } from '@/app/api/portfolios/analytics/route'
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

describe.skipIf(skipDb)('API - Portfolios', () => {
  let authToken: string
  let createdPortfolioId: string

  beforeAll(async () => {
    const res = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'superadmin@lean.com',
          password: 'Admin@123',
        }),
      })
    )
    const data = await res.json()
    authToken = data.token
  })

  it('GET /api/portfolios — should return list of portfolios', async () => {
    const res = await GET(
      nextRequest('http://localhost:3000/api/portfolios', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.portfolios)).toBe(true)
  })

  it('POST /api/portfolios — should create a new portfolio', async () => {
    const ts = Date.now()
    const res = await POST(
      nextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio ' + ts,
          code: 'TP' + ts.toString().slice(-4),
          description: 'Test portfolio for automated testing',
          estimatedBudget: 100000,
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.governanceState).toBe('DRAFT')
    createdPortfolioId = data.id
  })

  it('GET /api/portfolios/:id — should return portfolio details', async () => {
    if (!createdPortfolioId) return
    const res = await GetById(
      nextRequest(`http://localhost:3000/api/portfolios/${createdPortfolioId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      { params: { id: createdPortfolioId } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.portfolio).toBeDefined()
    expect(data.portfolio.id).toBe(createdPortfolioId)
    expect(data.portfolio.products).toBeDefined()
    expect(data.portfolio._count).toBeDefined()
  })

  it('PATCH /api/portfolios/:id — should update portfolio (Super Admin)', async () => {
    if (!createdPortfolioId) return
    const res = await PATCH(
      nextRequest(`http://localhost:3000/api/portfolios/${createdPortfolioId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Test Portfolio',
          priority: 'HIGH',
          description: 'Updated description',
        }),
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      { params: { id: createdPortfolioId } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.portfolio.name).toBe('Updated Test Portfolio')
  })

  it('PATCH /api/portfolios/:id — should reject invalid priority', async () => {
    if (!createdPortfolioId) return
    const res = await PATCH(
      nextRequest(`http://localhost:3000/api/portfolios/${createdPortfolioId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: 'INVALID' }),
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      { params: { id: createdPortfolioId } }
    )
    expect(res.status).toBe(400)
  })

  it('DELETE /api/portfolios/:id — should delete a draft portfolio', async () => {
    if (!createdPortfolioId) return
    const res = await DELETE(
      nextRequest(`http://localhost:3000/api/portfolios/${createdPortfolioId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      { params: { id: createdPortfolioId } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('GET /api/portfolios — should reject unauthenticated request', async () => {
    const res = await GET(nextRequest('http://localhost:3000/api/portfolios'))
    expect(res.status).toBe(401)
  })

  it('POST /api/portfolios — VIEWER role should be rejected', async () => {
    const loginRes = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'viewer@lean.com',
          password: 'User@123',
        }),
      })
    )
    const { token } = await loginRes.json()
    const res = await POST(
      nextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Should Fail',
          code: 'SF',
          description: 'Viewer cannot create',
        }),
        headers: { Authorization: `Bearer ${token}` },
      })
    )
    expect(res.status).toBe(403)
  })
})

describe.skipIf(skipDb)('API - Portfolio Analytics', () => {
  let authToken: string

  beforeAll(async () => {
    const res = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'superadmin@lean.com',
          password: 'Admin@123',
        }),
      })
    )
    const data = await res.json()
    authToken = data.token
  })

  it('GET /api/portfolios/analytics — should return analytics data', async () => {
    const res = await GetAnalytics(
      nextRequest('http://localhost:3000/api/portfolios/analytics', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.byStatus).toBeDefined()
    expect(Array.isArray(data.byStatus)).toBe(true)
    expect(data.byPriority).toBeDefined()
    expect(data.productDistribution).toBeDefined()
    expect(data.financials).toBeDefined()
    expect(data.managers).toBeDefined()
  })

  it('GET /api/portfolios/analytics — supports status filter', async () => {
    const res = await GetAnalytics(
      nextRequest('http://localhost:3000/api/portfolios/analytics?statuses=DRAFT,APPROVED', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    // All returned statuses should be DRAFT or APPROVED
    data.byStatus.forEach((s: any) => {
      expect(['DRAFT', 'APPROVED']).toContain(s.status)
    })
  })

  it('GET /api/portfolios/analytics — rejects unauthenticated', async () => {
    const res = await GetAnalytics(
      nextRequest('http://localhost:3000/api/portfolios/analytics')
    )
    expect(res.status).toBe(401)
  })
})

describe.skipIf(skipDb)('API - Portfolio Delete Safety', () => {
  let authToken: string
  let viewerToken: string

  beforeAll(async () => {
    const res = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'superadmin@lean.com', password: 'Admin@123' }),
      })
    )
    authToken = (await res.json()).token

    const viewerRes = await LoginPOST(
      nextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'viewer@lean.com', password: 'User@123' }),
      })
    )
    viewerToken = (await viewerRes.json()).token
  })

  it('DELETE — VIEWER cannot delete portfolio', async () => {
    const res = await DELETE(
      nextRequest('http://localhost:3000/api/portfolios/nonexistent', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${viewerToken}` },
      }),
      { params: { id: 'nonexistent' } }
    )
    expect(res.status).toBe(403)
  })

  it('DELETE — returns 404 for non-existent portfolio', async () => {
    const res = await DELETE(
      nextRequest('http://localhost:3000/api/portfolios/nonexistent-id', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      { params: { id: 'nonexistent-id' } }
    )
    expect(res.status).toBe(404)
  })
})
