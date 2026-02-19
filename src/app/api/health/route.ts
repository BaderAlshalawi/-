import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * Health check for deployment diagnostics.
 * GET /api/health - no auth required.
 * Use this to verify the app is running and (optionally) DB is reachable.
 */
export async function GET() {
  const envOk =
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 0 &&
    typeof process.env.JWT_SECRET === 'string' &&
    process.env.JWT_SECRET.length >= 32

  let database: 'connected' | 'unavailable' = 'unavailable'
  if (envOk) {
    try {
      await prisma.$queryRaw`SELECT 1`
      database = 'connected'
    } catch (_) {
      database = 'unavailable'
    }
  }

  const status = database === 'connected' && envOk ? 'ok' : 'degraded'
  return NextResponse.json(
    {
      status,
      database,
      env: envOk ? 'ok' : 'missing_or_invalid',
    },
    { status: status === 'ok' ? 200 : 503 }
  )
}
