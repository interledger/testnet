import { Button } from '@/ui/Button'
import { Input } from '@/ui/forms/Input'
import { ChangePasswordForm } from './ChangePasswordForm'
import { usePasswordContext } from '@/lib/context/password'
import { UserResponse } from '@wallet/shared'
import { useState } from 'react'
import { WalletAccounts } from './WalletAccounts'
import { Account } from '@/lib/api/account'

type PersonalSettingsFormProps = {
  user: UserResponse
  accounts: Account[]
}

export const PersonalSettingsForm = ({
  user,
  accounts
}: PersonalSettingsFormProps) => {
  const { isChangePassword, setIsChangePassword } = usePasswordContext()
  const [walletAccountsOpen, setWalletAccountsOpen] = useState(false)

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-green dark:text-teal-neon">Details</h3>
      </div>
      <div className="mb-4">
        <Input
          label="Name"
          disabled
          value={`${user.firstName} ${user.lastName}`}
        />
      </div>
      <div className="mb-4">
        <Input
          type="email"
          label="Email"
          disabled
          placeholder="Address"
          value={user.email}
        />
      </div>
      <div className="mt-4 flex justify-between">
        {!isChangePassword ? (
          <Button
            intent="primary"
            aria-label="change password"
            onClick={() => setIsChangePassword(!isChangePassword)}
          >
            Change Password
          </Button>
        ) : (
          <Button
            intent="outline"
            aria-label="Cancel change password"
            onClick={() => setIsChangePassword(!isChangePassword)}
          >
            Cancel Change Password
          </Button>
        )}
      </div>
      {isChangePassword && <ChangePasswordForm />}
      <div className="mt-4 flex justify-between">
        {!walletAccountsOpen ? (
          <Button
            intent="primary"
            aria-label="wallet accounts"
            onClick={() => setWalletAccountsOpen(!walletAccountsOpen)}
          >
            Extra Accounts Settings
          </Button>
        ) : (
          <Button
            intent="outline"
            aria-label="close wallet accounts"
            onClick={() => setWalletAccountsOpen(!walletAccountsOpen)}
          >
            Hide Extra Accounts Settings
          </Button>
        )}
      </div>
      {walletAccountsOpen && <WalletAccounts accounts={accounts} />}
    </>
  )
}
