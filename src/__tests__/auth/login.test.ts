import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

function loginRequest(body: { email?: string; password?: string }) {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Authentication - Login', () => {
  it('should reject login with empty email', async () => {
    const res = await POST(loginRequest({ email: '', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('should reject login with empty password', async () => {
    const res = await POST(loginRequest({ email: 'test@test.com', password: '' }))
    expect(res.status).toBe(400)
  })

  it.skipIf(process.env.SKIP_DB_TESTS === '1')(
    'should reject login with invalid credentials',
    async () => {
      const res = await POST(
        loginRequest({ email: 'nonexistent@test.com', password: 'wrong' })
      )
      expect(res.status).toBe(401)
    }
  )

  it.skipIf(process.env.SKIP_DB_TESTS === '1')(
    'should return user and token on successful login',
    async () => {
      const res = await POST(
        loginRequest({ email: 'superadmin@lean.com', password: 'Admin@123' })
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
      expect(typeof data.token).toBe('string')
    }
  )
})
