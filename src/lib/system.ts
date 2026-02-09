import { prisma } from './prisma'

export async function getSystemConfig(key: string) {
  return prisma.systemConfig.findUnique({
    where: { key },
  })
}

export async function setSystemConfig(key: string, value: any, updatedBy?: string) {
  return prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      updatedBy,
      updatedAt: new Date(),
    },
    create: {
      key,
      value,
      updatedBy,
    },
  })
}

export async function isSystemFrozen(): Promise<boolean> {
  const config = await getSystemConfig('system_frozen')
  const value = config?.value as { frozen?: boolean } | null | undefined
  return value?.frozen === true
}

export async function freezeSystem(reason: string, frozenBy: string) {
  return setSystemConfig(
    'system_frozen',
    {
      frozen: true,
      reason,
      frozenAt: new Date().toISOString(),
      frozenBy,
    },
    frozenBy
  )
}

export async function unfreezeSystem(unfrozenBy: string) {
  return setSystemConfig(
    'system_frozen',
    {
      frozen: false,
      reason: null,
      frozenAt: null,
      frozenBy: null,
    },
    unfrozenBy
  )
}
