import { Account } from '@/lib/api/account'
import { Table } from '@/ui/Table'
import {
  ToggleCardsVisibility,
  ToggleWalletVisibility
} from './ToggleVisibility'
import { UserResponse } from '@wallet/shared'
import { Divider } from '@/ui/Divider'

type WalletAccountsProps = {
  accounts: Account[]
  user: UserResponse
}

export const WalletAccounts = ({ accounts, user }: WalletAccountsProps) => {
  return (
    <div className="pt-5">
      {accounts.length > 0 ? (
        <>
          <h3 className="text-lg text-green dark:text-teal-neon">
            Set visibility of accounts
          </h3>
          <div>
            <Table>
              <Table.Head columns={['Account', 'Visible']} />
              <Table.Body>
                {accounts.map((account) => (
                  <Table.Row key={account.id}>
                    <Table.Cell>
                      {account.name} - {account.assetCode}
                    </Table.Cell>
                    <Table.Cell>
                      <ToggleWalletVisibility account={account} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          <Divider />
        </>
      ) : null}
      <div className="flex flex-row">
        <div className="text-green dark:text-teal-neon pr-4">Show Cards</div>
        <ToggleCardsVisibility user={user} />
      </div>
    </div>
  )
}
