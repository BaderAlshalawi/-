import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'audit:export')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const actorEmail = searchParams.get('actorEmail')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (actorEmail) where.actorEmail = { contains: actorEmail, mode: 'insensitive' }
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
    })

    const csvHeader = 'ID,Timestamp,Actor User ID,Actor Email,Actor Name,Action,Entity Type,Entity ID,Entity Name,Changed Fields,Comment,IP Address,User Agent'
    const csvRows = logs.map((log) => {
      const changedFieldsStr = log.changedFields
        ? JSON.stringify(log.changedFields).replace(/"/g, '""')
        : ''
      return [
        log.id,
        log.timestamp.toISOString(),
        log.actorUserId || '',
        log.actorEmail || '',
        log.actorName || '',
        log.action,
        log.entityType,
        log.entityId || '',
        log.entityName || '',
        `"${changedFieldsStr}"`,
        `"${(log.comment || '').replace(/"/g, '""')}"`,
        log.ipAddress || '',
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csv = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export audit log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
