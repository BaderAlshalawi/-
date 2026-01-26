import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSystemConfig } from '@/lib/system'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getSystemConfig('system_frozen')
    const frozen = config?.value?.frozen === true

    return NextResponse.json({
      frozen,
      reason: config?.value?.reason || null,
    })
  } catch (error) {
    console.error('Get system status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
