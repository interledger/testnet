import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { GrantResponse } from '@wallet/shared'
type GrantDetailsProps = { grant: GrantResponse }

export const GrantDetails = ({ grant }: GrantDetailsProps) => {
  return (
    <div className="flex flex-col my-6">
      <div className="text-xl">
        <span className="font-semibold">Client: </span>
        <span className="font-light">{grant.client}</span>
      </div>
      <div>
        <span>Created at: </span>
        <span className="font-light">{grant.createdAt}</span>
      </div>
      <div className="flex items-center">
        <span className="mr-4">State: </span>
        {!grant.finalizationReason ? (
          <Badge
            intent={getStatusBadgeIntent(grant.state)}
            size="md"
            text={grant.state}
          />
        ) : null}
        {grant.finalizationReason ? (
          <>
            <Badge
              intent={getStatusBadgeIntent(grant.finalizationReason)}
              size="md"
              text={
                grant.finalizationReason === 'REVOKED'
                  ? 'REVOKED'
                  : grant.finalizationReason === 'ISSUED'
                    ? 'APPROVED'
                    : 'REJECTED'
              }
            />
          </>
        ) : null}
      </div>
      <div className="border-b border-b-green dark:border-b-pink-neon py-2 text-lg font-semibold">
        Access - Permissions:
      </div>
      {grant.access.map((accessDetails, index) => (
        <div
          key={`${grant.id}-${index}`}
          className="border-b border-b-green dark:border-b-pink-neon py-2"
        >
          <div>
            <span>Access type: </span>
            <span className="text-sm">{accessDetails.type.toUpperCase()}</span>
          </div>
          {accessDetails.identifier ? (
            <div>
              <span>Access to your payment pointer: </span>
              <span className="font-light">{accessDetails.identifier}</span>
            </div>
          ) : null}
          <div className="flex flex-row items-center">
            <span>Access action: </span>
            <div className="mx-2 h-1.5 w-1.5 rounded-full bg-pink-dark ring-1 ring-pink-dark dark:ring-teal-neon dark:bg-teal-neon" />
            {accessDetails.actions.map((permission, index) => (
              <div
                key={`${accessDetails.id}-${index}`}
                className="flex items-center"
              >
                <span className="text-sm">{permission.toUpperCase()}</span>
                <div className="mx-2 h-1.5 w-1.5 rounded-full bg-pink-dark ring-1 ring-pink-dark dark:ring-teal-neon dark:bg-teal-neon" />
              </div>
            ))}
          </div>
          {accessDetails.limits ? (
            <>
              {accessDetails.limits.debitAmount ? (
                <div>
                  <span>Amount to send: </span>
                  <span className="font-light">
                    {accessDetails.limits.debitAmount.formattedAmount}
                  </span>
                </div>
              ) : null}
              {accessDetails.limits.receiveAmount ? (
                <div>
                  <span>Amount to receive: </span>
                  <span className="font-light">
                    {accessDetails.limits.receiveAmount.formattedAmount}
                  </span>
                </div>
              ) : null}
              {accessDetails.limits.receiver ? (
                <div>
                  <span>Payment Pointer of the receiver: </span>
                  <span className="font-light">
                    {accessDetails.limits.receiver}
                  </span>
                </div>
              ) : null}
              {accessDetails.limits.interval ? (
                <div>
                  <span>Interval between payments: </span>
                  <span className="font-light">
                    {accessDetails.limits.interval}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ))}
    </div>
  )
}
