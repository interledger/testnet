import { Account, accountService } from '@/lib/api/account'
import { userService } from '@/lib/api/user'
import { Switch } from '@headlessui/react'
import { UserResponse } from '@wallet/shared'
import { useState } from 'react'

type ToggleWalletVisibilityProps = {
  account: Account
}

export const ToggleWalletVisibility = ({
  account
}: ToggleWalletVisibilityProps) => {
  const [enabled, setEnabled] = useState(!account.isHidden)
  return (
    <Switch
      checked={enabled}
      onChange={async () => {
        await accountService.update({
          accountId: account.id,
          isHidden: enabled
        })

        setEnabled(!enabled)
      }}
      className={`${enabled ? 'bg-green-modal' : 'bg-orange-dark'}
          relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </Switch>
  )
}

type ToggleCardsVisibilityProps = {
  user: UserResponse
}

export const ToggleCardsVisibility = ({ user }: ToggleCardsVisibilityProps) => {
  const [enabled, setEnabled] = useState(!false) //user.isCardsEnabled
  return (
    <Switch
      checked={enabled}
      onChange={async () => {
        await userService.update({
          userId: user.email,
          isCardsEnabled: enabled
        })

        setEnabled(!enabled)
      }}
      className={`${enabled ? 'bg-green-modal' : 'bg-orange-dark'}
          relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </Switch>
  )
}
