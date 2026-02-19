import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MODEL_MAP: Record<string, string> = {
  phases: 'lookupPhase',
  quarters: 'lookupQuarter',
  'team-types': 'lookupTeamType',
  positions: 'lookupPosition',
  'grade-roles': 'lookupGradeRole',
}

function getModel(type: string) {
  const modelName = MODEL_MAP[type]
  if (!modelName) return null
  return (prisma as any)[modelName]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const model = getModel(params.type)
  if (!model) return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 })

  const body = await request.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
  if (body.isActive !== undefined) data.isActive = body.isActive

  try {
    const item = await model.update({ where: { id: params.id }, data })
    return NextResponse.json({ item })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 })
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw e
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const model = getModel(params.type)
  if (!model) return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 })

  try {
    await model.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (e.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete: item is in use. Deactivate it instead.' }, { status: 409 })
    }
    throw e
  }
}
