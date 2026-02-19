import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  computePortfolioFinancialSummary,
  getPortfolioCostBreakdowns,
} from '@/lib/resource-costing'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const includeBreakdowns = request.nextUrl.searchParams.get('breakdowns') !== 'false'

  const summary = await computePortfolioFinancialSummary(params.id)

  if (includeBreakdowns) {
    const breakdowns = await getPortfolioCostBreakdowns(params.id)
    return NextResponse.json({ ...summary, breakdowns })
  }

  return NextResponse.json(summary)
}
