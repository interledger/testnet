import { Grant } from '@/lib/api/grants'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'

type GrantDetailsProps = { grant: Grant; isAcceptedGrant: boolean }

export const GrantDetails = ({ grant, isAcceptedGrant }: GrantDetailsProps) => {
  return (
    <div className="flex flex-col text-green sm:my-10">
      <div className="text-xl text-turqoise">
        <span className="font-semibold">Client: </span>
        <span className="font-light">{grant.client}</span>
      </div>
      {isAcceptedGrant && (
        <>
          <div>
            <span>Created at: </span>
            <span className="font-light">{grant.createdAt}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-4">State: </span>
            <Badge
              intent={getStatusBadgeIntent(grant.state)}
              size="md"
              text={grant.state}
            />
          </div>
        </>
      )}
      <div className="border-b border-b-green-5 py-2 text-lg font-semibold">
        Access - Permissions:
      </div>
      {grant.access.map((accessDetails) => (
        <div key={grant.id} className="border-b border-b-green-5 py-2">
          <div>
            <span>Access type: </span>
            <span className="text-sm">{accessDetails.type.toUpperCase()}</span>
          </div>
          {accessDetails.identifier && (
            <div>
              <span>Payment Pointer access: </span>
              <span className="font-light">{accessDetails.identifier}</span>
            </div>
          )}
          <div className="flex flex-row items-center">
            <span>Access action: </span>
            <div className="mx-2 h-1.5 w-1.5 rounded-full bg-green-4 ring-1 ring-green-3" />
            {accessDetails.actions.map((permission) => (
              <div key={accessDetails.id} className="flex items-center">
                <span className="text-sm">{permission.toUpperCase()}</span>
                <div className="mx-2 h-1.5 w-1.5 rounded-full bg-green-4 ring-1 ring-green-3" />
              </div>
            ))}
          </div>
          {accessDetails.limits && (
            <>
              {accessDetails.limits.sendAmount && (
                <div>
                  <span>Amount to send: </span>
                  <span className="font-light">
                    {accessDetails.limits.sendAmount.formattedAmount}
                  </span>
                </div>
              )}
              {accessDetails.limits.receiveAmount && (
                <div>
                  <span>Amount to receive: </span>
                  <span className="font-light">
                    {accessDetails.limits.receiveAmount.formattedAmount}
                  </span>
                </div>
              )}
              {accessDetails.limits.receiver && (
                <div>
                  <span>Payment Pointer of the receiver: </span>
                  <span className="font-light">
                    {accessDetails.limits.receiver}
                  </span>
                </div>
              )}
              {accessDetails.limits.interval && (
                <div>
                  <span>Interval between payments: </span>
                  <span className="font-light">
                    {accessDetails.limits.interval}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
