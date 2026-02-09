import { prisma } from './prisma'
import { AuditAction, EntityType } from '@/types'
import { headers } from 'next/headers'

export interface AuditLogInput {
  actor: Pick<import('@/types').User, 'id' | 'email' | 'name' | 'role' | 'status'>
  action: AuditAction
  entityType: EntityType
  entityId?: string
  entityName?: string
  changedFields?: Record<string, { old: any; new: any }>
  comment?: string
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const headersList = headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actor.id,
      actorEmail: input.actor.email,
      actorName: input.actor.name,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      changedFields: input.changedFields ?? undefined,
      comment: input.comment ?? undefined,
      ipAddress,
      userAgent,
    },
  })
}
