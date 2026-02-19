import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.hostingCost.findUnique({ where: { id: params.costId } })
  if (!existing || existing.portfolioId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const data: any = {}
  if (body.amount !== undefined) data.amount = Number(body.amount)
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.period !== undefined) data.period = body.period || null
  if (body.category !== undefined) data.category = body.category

  const cost = await prisma.hostingCost.update({
    where: { id: params.costId },
    data,
  })

  return NextResponse.json({ cost })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const existing = await prisma.hostingCost.findUnique({ where: { id: params.costId } })
    if (!existing || existing.portfolioId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.hostingCost.delete({ where: { id: params.costId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }
}
