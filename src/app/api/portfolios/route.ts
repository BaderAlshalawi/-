import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { GovernanceState, type User } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portfolios = await prisma.portfolio.findMany({
      include: {
        programManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            governanceState: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ portfolios })
  } catch (error) {
    console.error('Get portfolios error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createPortfolioSchema = {
  name: (v: unknown) => typeof v === 'string' && v.length > 0,
  code: (v: unknown) => typeof v === 'string' && /^[A-Z0-9]{1,20}$/.test(v),
  description: (v: unknown) => v == null || typeof v === 'string',
  estimatedBudget: (v: unknown) => v == null || (typeof v === 'number' && v >= 0),
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await canPerform(user as User, 'portfolio:create')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const name = body?.name
    const code = body?.code ?? String(Date.now()).slice(-6)
    const description = body?.description ?? null
    const estimatedBudget = body?.estimatedBudget != null ? Number(body.estimatedBudget) : null

    if (!createPortfolioSchema.name(name)) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    if (!createPortfolioSchema.code(code)) {
      return NextResponse.json(
        { error: 'Code must be 1-20 uppercase alphanumeric characters' },
        { status: 400 }
      )
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        estimatedBudget,
        governanceState: GovernanceState.DRAFT,
      },
    })

    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    console.error('Create portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
