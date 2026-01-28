import { NextRequest } from 'next/server'
import jwt, { SignOptions } from 'jsonwebtoken'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const JWT_SECRET: string = process.env.JWT_SECRET || 'QeP0lhWxsnqeM/PvKucL9ZG8r+GeXHXEiStM7+4KF9c='
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 12)
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

export function generateToken(payload: JWTPayload): string {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
  
  try {
    // Type assertion needed due to jsonwebtoken type definitions
    // expiresIn accepts string (like '7d') which is valid
    return jwt.sign(
      payload as object,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    ) as string
  } catch (error) {
    console.error('Error generating token:', error)
    throw new Error('Failed to generate token')
  }
}

export function verifyToken(token: string): JWTPayload | null {
  if (!token) {
    return null
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('Invalid JWT_SECRET configuration')
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    // Validate payload structure
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.error('Invalid token payload structure')
      return null
    }

    return decoded
  } catch (error) {
    // Token is invalid, expired, or malformed
    if (error instanceof jwt.TokenExpiredError) {
      console.debug('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.debug('Invalid token:', error.message)
    } else {
      console.error('Error verifying token:', error)
    }
    return null
  }
}

export async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // Try to fetch user from database, but handle errors gracefully
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          assignedPortfolioId: true,
        },
      })

      if (!user || user.status !== 'ACTIVE') {
        return null
      }

      return user
    } catch (dbError: any) {
      // If database is unavailable, log error and return null
      // This ensures security - we can't verify user status without database
      console.error('Database error in getCurrentUser:', dbError?.message || dbError)
      
      // Check if it's a connection error
      if (dbError?.code === 'P1001' || dbError?.message?.includes('Can\'t reach database')) {
        console.error('Database connection failed - user authentication unavailable')
      }
      
      // Return null to force re-authentication when database is down
      // This is more secure than returning a fallback user
      return null
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}
