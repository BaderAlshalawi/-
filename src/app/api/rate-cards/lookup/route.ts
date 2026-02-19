import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { lookupHourlyCost } from '@/lib/resource-costing'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teamTypeId = request.nextUrl.searchParams.get('teamTypeId')
  const gradeRoleId = request.nextUrl.searchParams.get('gradeRoleId')

  if (!teamTypeId || !gradeRoleId) {
    return NextResponse.json({ error: 'teamTypeId and gradeRoleId required' }, { status: 400 })
  }

  const hourlyCost = await lookupHourlyCost(teamTypeId, gradeRoleId)

  return NextResponse.json({ hourlyCost })
}
