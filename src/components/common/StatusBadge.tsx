import { Badge } from '@/components/ui/badge'
import { GovernanceState, FeatureState } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: GovernanceState | FeatureState
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'outline',
    SUBMITTED: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive',
    LOCKED: 'default',
    ARCHIVED: 'outline',
    DISCOVERY: 'outline',
    READY: 'secondary',
    IN_PROGRESS: 'default',
    RELEASED: 'default',
  }

  return (
    <Badge variant={variantMap[status] || 'outline'} className={cn(className)}>
      {status.replace('_', ' ')}
    </Badge>
  )
}
