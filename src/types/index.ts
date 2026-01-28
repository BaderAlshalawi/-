import { 
  UserRole, 
  UserStatus, 
  GovernanceState, 
  FeatureState, 
  PriorityLevel,
  AuditAction,
  EntityType
} from '@prisma/client'

// Export enums - Prisma enums work as both types and values
export { UserRole, UserStatus, GovernanceState, FeatureState, PriorityLevel, AuditAction, EntityType }

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string | null
  assignedPortfolioId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Portfolio {
  id: string
  name: string
  code: string
  description?: string | null
  governanceState: GovernanceState
  isLocked: boolean
  lockedAt?: Date | null
  lockedById?: string | null
  rejectionReason?: string | null
  rejectedAt?: Date | null
  rejectedById?: string | null
  submittedAt?: Date | null
  submittedById?: string | null
  approvedAt?: Date | null
  approvedById?: string | null
  programManagerId?: string | null
  priority?: PriorityLevel | null
  createdAt: Date
  updatedAt: Date
  archivedAt?: Date | null
  archivedById?: string | null
  programManager?: User | null
  products?: Product[]
}

export interface Product {
  id: string
  portfolioId: string
  name: string
  code: string
  description?: string | null
  businessValue?: string | null
  targetClient?: string | null
  endUser?: string | null
  valueProposition?: string | null
  governanceState: GovernanceState
  isLocked: boolean
  lockedAt?: Date | null
  lockedById?: string | null
  rejectionReason?: string | null
  rejectedAt?: Date | null
  rejectedById?: string | null
  submittedAt?: Date | null
  submittedById?: string | null
  approvedAt?: Date | null
  approvedById?: string | null
  productManagerId?: string | null
  priority?: PriorityLevel | null
  createdAt: Date
  updatedAt: Date
  archivedAt?: Date | null
  archivedById?: string | null
  portfolio?: Portfolio
  productManager?: User | null
  releases?: Release[]
  features?: Feature[]
}

export interface Release {
  id: string
  productId: string
  version: string
  name: string
  description?: string | null
  startDate: Date
  endDate: Date
  governanceState: GovernanceState
  isLocked: boolean
  lockedAt?: Date | null
  lockedById?: string | null
  goNogoSubmitted: boolean
  goNogoSubmittedAt?: Date | null
  goNogoSubmittedById?: string | null
  goNogoDecision?: string | null
  goNogoDecidedAt?: Date | null
  goNogoDecidedById?: string | null
  goNogoNotes?: string | null
  readinessChecklist: any
  postReleaseNotes?: string | null
  createdAt: Date
  updatedAt: Date
  product?: Product
  features?: Feature[]
}

export interface Feature {
  id: string
  productId: string
  releaseId?: string | null
  name: string
  description?: string | null
  targetUser?: string | null
  customerSegmentation?: string | null
  valueProposition?: string | null
  businessModel?: string | null
  risksChallenges?: string | null
  startDate?: Date | null
  endDate?: Date | null
  state: FeatureState
  ownerId?: string | null
  priority?: PriorityLevel | null
  createdAt: Date
  updatedAt: Date
  archivedAt?: Date | null
  archivedById?: string | null
  product?: Product
  release?: Release | null
  owner?: User | null
}

export interface Document {
  id: string
  name: string
  filePath: string
  fileType?: string | null
  fileSize?: bigint | null
  portfolioId?: string | null
  productId?: string | null
  featureId?: string | null
  releaseId?: string | null
  uploadedById: string
  createdAt: Date
  uploadedBy?: User
}

export interface AuditLog {
  id: string
  timestamp: Date
  actorUserId?: string | null
  actorEmail?: string | null
  actorName?: string | null
  action: AuditAction
  entityType: EntityType
  entityId?: string | null
  entityName?: string | null
  changedFields?: any
  comment?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  actor?: User | null
}

export interface SystemConfig {
  id: string
  key: string
  value: any
  updatedBy?: string | null
  createdAt: Date
  updatedAt: Date
}
