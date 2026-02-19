import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPerform } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { AuditAction, EntityType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')
    const productId = searchParams.get('productId')
    const featureId = searchParams.get('featureId')
    const releaseId = searchParams.get('releaseId')

    const where: any = {}
    if (portfolioId) where.portfolioId = portfolioId
    if (productId) where.productId = productId
    if (featureId) where.featureId = featureId
    if (releaseId) where.releaseId = releaseId

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
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

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await canPerform(user, 'document:upload', {})
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Note: In a real implementation, you would handle file upload here
    // For now, we'll accept metadata and store a placeholder path
    const { name, filePath, fileType, fileSize, portfolioId, productId, featureId, releaseId } =
      await request.json()

    if (!name || !filePath) {
      return NextResponse.json(
        { error: 'Name and file path are required' },
        { status: 400 }
      )
    }

    // Validate that exactly one entity is linked
    const entityCount = [portfolioId, productId, featureId, releaseId].filter(Boolean).length
    if (entityCount !== 1) {
      return NextResponse.json(
        { error: 'Exactly one entity (portfolio, product, feature, or release) must be linked' },
        { status: 400 }
      )
    }

    const document = await prisma.document.create({
      data: {
        name,
        filePath,
        fileType: fileType || null,
        fileSize: fileSize ? BigInt(fileSize) : null,
        portfolioId: portfolioId || null,
        productId: productId || null,
        featureId: featureId || null,
        releaseId: releaseId || null,
        uploadedById: user.id,
      },
    })

    // Audit log
    await createAuditLog({
      actor: user,
      action: AuditAction.CREATE,
      entityType: EntityType.DOCUMENT,
      entityId: document.id,
      entityName: document.name,
      comment: 'Document uploaded',
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
