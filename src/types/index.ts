export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PROGRAM_MANAGER: 'PROGRAM_MANAGER',
  PRODUCT_MANAGER: 'PRODUCT_MANAGER',
  VIEWER: 'VIEWER',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const GovernanceState = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  LOCKED: 'LOCKED',
  ARCHIVED: 'ARCHIVED',
} as const
export type GovernanceState = (typeof GovernanceState)[keyof typeof GovernanceState]

export const FeatureState = {
  DISCOVERY: 'DISCOVERY',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  RELEASED: 'RELEASED',
  ARCHIVED: 'ARCHIVED',
} as const
export type FeatureState = (typeof FeatureState)[keyof typeof FeatureState]

export const PriorityLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const
export type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel]

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  LOCK: 'LOCK',
  UNLOCK: 'UNLOCK',
  ASSIGN: 'ASSIGN',
  UNASSIGN: 'UNASSIGN',
  DEACTIVATE: 'DEACTIVATE',
  REACTIVATE: 'REACTIVATE',
  ARCHIVE: 'ARCHIVE',
  FREEZE: 'FREEZE',
  UNFREEZE: 'UNFREEZE',
} as const
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

export const EntityType = {
  PORTFOLIO: 'PORTFOLIO',
  PRODUCT: 'PRODUCT',
  FEATURE: 'FEATURE',
  RELEASE: 'RELEASE',
  USER: 'USER',
  DOCUMENT: 'DOCUMENT',
  SYSTEM: 'SYSTEM',
  RESOURCE: 'RESOURCE',
  RESOURCE_ASSIGNMENT: 'RESOURCE_ASSIGNMENT',
  COST_ENTRY: 'COST_ENTRY',
  RATE_CARD: 'RATE_CARD',
  HOSTING_COST: 'HOSTING_COST',
  LOOKUP: 'LOOKUP',
} as const
export type EntityType = (typeof EntityType)[keyof typeof EntityType]

export const CostCategory = {
  LABOR: 'LABOR',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  LICENSING: 'LICENSING',
  THIRD_PARTY: 'THIRD_PARTY',
  OTHER: 'OTHER',
} as const
export type CostCategory = (typeof CostCategory)[keyof typeof CostCategory]

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
  estimatedBudget?: number | null
  actualCost?: number | null
  costCurrency?: string | null
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

// ─── Resource Costing Types ───

export const HostingCostCategory = {
  LICENSE: 'LICENSE',
  INFRA: 'INFRA',
  OTHERS: 'OTHERS',
  INDIRECT: 'INDIRECT',
} as const
export type HostingCostCategory = (typeof HostingCostCategory)[keyof typeof HostingCostCategory]

export interface LookupItem {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export interface LookupFeatureItem extends LookupItem {
  portfolioId: string
}

export interface RateCardItem {
  id: string
  teamTypeId: string
  gradeRoleId: string
  monthlyCost: number
  dailyCost: number
  hourlyCost: number
  currency: string
  effectiveFrom?: string | null
  effectiveTo?: string | null
  isActive: boolean
  teamType?: LookupItem
  gradeRole?: LookupItem
}

export interface ResourceAllocationItem {
  id: string
  portfolioId: string
  featureId?: string | null
  phaseId: string
  quarterId?: string | null
  teamTypeId: string
  positionId?: string | null
  gradeRoleId: string
  hourlyCostSnapshot: number
  actualHours: number
  utilization: number
  actualCostComputed: number
  durationDaysComputed: number
  currency: string
  feature?: LookupItem | null
  phase?: LookupItem
  quarter?: LookupItem | null
  teamType?: LookupItem
  position?: LookupItem | null
  gradeRole?: LookupItem
}

export interface HostingCostItem {
  id: string
  portfolioId: string
  category: HostingCostCategory
  amount: number
  currency: string
  notes?: string | null
  period?: string | null
}

export interface PortfolioFinancialSummary {
  laborCostTotal: number
  hostingCostTotal: number
  portfolioTotalCost: number
  estimatedBudget: number | null
  variance: number | null
  currency: string
  breakdowns?: {
    byPhase: Record<string, number>
    byTeamType: Record<string, number>
    byFeature: Record<string, number>
    byQuarter: Record<string, number>
    byGradeRole: Record<string, number>
    hostingByCategory: Record<string, number>
  }
}
