import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/portfolios/route'
import { GET as GetProducts } from '@/app/api/products/route'
import { NextRequest } from 'next/server'

function nextRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('Auth Middleware', () => {
  it('should reject /api/portfolios without token', async () => {
    const res = await GET(nextRequest('http://localhost:3000/api/portfolios'))
    expect(res.status).toBe(401)
  })

  it('should reject /api/products without token', async () => {
    const res = await GetProducts(nextRequest('http://localhost:3000/api/products'))
    expect(res.status).toBe(401)
  })

  it('should reject requests with malformed token', async () => {
    const res = await GET(
      nextRequest('http://localhost:3000/api/portfolios', {
        Authorization: 'Bearer invalid.token.here',
      })
    )
    expect(res.status).toBe(401)
  })
})
