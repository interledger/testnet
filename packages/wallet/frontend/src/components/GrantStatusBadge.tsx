import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { GrantResponse } from '@wallet/shared'

// APPROVED: the user consented but the client hasn't continued the grant yet
const statuses: Record<string, { label: string; intent: string }> = {
  ISSUED: { label: 'APPROVED', intent: 'ISSUED' },
  APPROVED: { label: 'AWAITING CLIENT', intent: 'PENDING' }
}

export const GrantStatusBadge = ({ grant }: { grant: GrantResponse }) => {
  const status = grant.finalizationReason ?? grant.state
  const { label, intent } = statuses[status] ?? {
    label: status,
    intent: status
  }

  return <Badge intent={getStatusBadgeIntent(intent)} size="md" text={label} />
}
