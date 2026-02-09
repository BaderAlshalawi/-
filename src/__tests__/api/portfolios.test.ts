import { describe, it, expect, beforeAll } from 'vitest'
import { GET, POST } from '@/app/api/portfolios/route'
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
    const res = await POST(
      nextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Portfolio ' + Date.now(),
          code: 'TP' + Date.now().toString().slice(-4),
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
