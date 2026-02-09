import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'

function registerRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Authentication - Signup', () => {
  it('should reject signup with missing fields', async () => {
    const res = await POST(registerRequest({ email: 'test@test.com' }))
    expect(res.status).toBe(400)
  })

  it('should reject signup with invalid email format', async () => {
    const res = await POST(
      registerRequest({
        email: 'not-an-email',
        password: 'Password1!',
        name: 'Test',
      })
    )
    expect(res.status).toBe(400)
  })

  it('should reject signup with weak password (less than 8 chars)', async () => {
    const res = await POST(
      registerRequest({
        email: 'new@test.com',
        password: '123',
        name: 'Test',
      })
    )
    expect(res.status).toBe(400)
  })

  it.skipIf(process.env.SKIP_DB_TESTS === '1')(
    'should reject duplicate email registration',
    async () => {
      const res = await POST(
        registerRequest({
          email: 'admin@lean.com',
          password: 'Admin@123!',
          name: 'Dup',
        })
      )
      expect(res.status).toBe(409)
    }
  )
})
