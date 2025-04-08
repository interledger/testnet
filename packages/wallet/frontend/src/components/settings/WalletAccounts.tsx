import { Account } from '@/lib/api/account'
import { Table } from '@/ui/Table'
import { ToggleWalletVisibility } from './ToggleWalletVisibility'

type WalletAccountsProps = {
  accounts: Account[]
}

export const WalletAccounts = ({ accounts }: WalletAccountsProps) => {
  return (
    <div className="pt-5">
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
    </div>
  )
}
