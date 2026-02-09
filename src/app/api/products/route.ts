import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import type { User } from '@/types'
import { GovernanceState } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        productManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createProductSchema = {
  name: (v: unknown) => typeof v === 'string' && v.length > 0,
  code: (v: unknown) => v == null || (typeof v === 'string' && /^[A-Z0-9]{1,20}$/.test(v)),
  portfolioId: (v: unknown) => typeof v === 'string' && v.length > 0,
  description: (v: unknown) => v == null || typeof v === 'string',
  valueProposition: (v: unknown) => v == null || typeof v === 'string',
  targetClient: (v: unknown) => v == null || typeof v === 'string',
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const portfolioId = body?.portfolioId
    if (!createProductSchema.portfolioId(portfolioId)) {
      return NextResponse.json(
        { error: 'portfolioId is required' },
        { status: 400 }
      )
    }

    const allowed = await canPerform(user as User, 'product:create', { portfolioId })
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const name = body?.name
    const code = body?.code ?? String(Date.now()).slice(-6)
    const description = body?.description ?? null
    const valueProposition = body?.valueProposition ?? null
    const targetClient = body?.targetClient ?? null

    if (!createProductSchema.name(name)) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        code: (code as string).toUpperCase(),
        description,
        valueProposition,
        targetClient,
        portfolioId,
        governanceState: GovernanceState.DRAFT,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
