import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MODEL_MAP: Record<string, any> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const model = getModel(params.type)
  if (!model) return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 })

  const activeOnly = request.nextUrl.searchParams.get('activeOnly') !== 'false'

  const items = await model.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ items })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const model = getModel(params.type)
  if (!model) return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 })

  const body = await request.json()
  const { name, sortOrder } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    const item = await model.create({
      data: { name: name.trim(), sortOrder: sortOrder ?? 0 },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 })
    }
    throw e
  }
}
