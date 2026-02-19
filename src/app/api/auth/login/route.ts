import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.status !== 'ACTIVE') {
      try {
        await createAuditLog({
          actor: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
          action: AuditAction.CREATE,
          entityType: EntityType.USER,
          entityId: user.id,
          entityName: user.email,
          comment: 'Failed login attempt: user inactive',
        })
      } catch { /* non-blocking */ }
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Create audit log (don't fail login if audit log fails)
    try {
      await createAuditLog({
        actor: user,
        action: AuditAction.CREATE,
        entityType: EntityType.USER,
        entityId: user.id,
        entityName: user.email,
        comment: 'User logged in',
      })
    } catch (auditError) {
      // Log error but don't fail login
      console.error('Audit log error (non-blocking):', auditError)
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        assignedPortfolioId: user.assignedPortfolioId,
      },
      token, // For API clients and tests using Authorization: Bearer
    })

    // Set cookie with proper configuration
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all paths
    })

    // Log token creation for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token generated and cookie set for user:', user.email)
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
