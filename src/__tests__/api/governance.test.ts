import { describe, it, expect, beforeAll } from 'vitest'
import { POST as LoginPOST } from '@/app/api/auth/login/route'
import { POST as CreatePortfolio } from '@/app/api/portfolios/route'
import { GET as GetPortfolio } from '@/app/api/portfolios/[id]/route'
import { POST as SubmitPortfolio } from '@/app/api/portfolios/[id]/submit/route'
import { POST as ApprovePortfolio } from '@/app/api/portfolios/[id]/approve/route'
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

describe.skipIf(skipDb)('Governance Workflow — Portfolio State Transitions', () => {
  let adminToken: string
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
    adminToken = loginData.token

    const createRes = await CreatePortfolio(
      nextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Governance Test ' + Date.now(),
          code: 'GT' + Date.now().toString().slice(-4),
          description: 'For workflow testing',
        }),
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    )
    const portfolio = await createRes.json()
    portfolioId = portfolio.id
  })

  it('should start in DRAFT status', async () => {
    if (!portfolioId) return
    const res = await GetPortfolio(
      nextRequest('http://localhost:3000/api/portfolios/' + portfolioId, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      { params: { id: portfolioId } }
    )
    const data = await res.json()
    expect(data.portfolio.governanceState).toBe('DRAFT')
  })

  it('should transition from DRAFT to SUBMITTED', async () => {
    if (!portfolioId) return
    const res = await SubmitPortfolio(
      nextRequest(
        'http://localhost:3000/api/portfolios/' + portfolioId + '/submit',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      ),
      { params: { id: portfolioId } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.portfolio.governanceState).toBe('SUBMITTED')
  })

  it('should transition from SUBMITTED to APPROVED', async () => {
    if (!portfolioId) return
    const res = await ApprovePortfolio(
      nextRequest(
        'http://localhost:3000/api/portfolios/' + portfolioId + '/approve',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      ),
      { params: { id: portfolioId } }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.portfolio.governanceState).toBe('APPROVED')
  })
})
