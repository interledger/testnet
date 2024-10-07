import { Button } from '@/ui/Button'

import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { useEffect } from 'react'
import { profileSchema } from '@/lib/api/user'

import { ChangePasswordForm } from './ChangePasswordForm'
import { usePasswordContext } from '@/lib/context/password'
import { UserResponse } from '@wallet/shared'

type PersonalSettingsFormProps = {
  user: UserResponse
}

// TODO: Can these details be updated by the user when switching to GateHub?
export const PersonalSettingsForm = ({ user }: PersonalSettingsFormProps) => {
  const { isChangePassword, setIsChangePassword } = usePasswordContext()

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-green dark:text-teal-neon">Details</h3>
      </div>
      <div className="mb-4 mt-6">
        <Input
          label="First name"
          placeholder="First name"
          disabled
          value={user.firstName}
        />
      </div>
      <div className="mb-4 mt-6">
        <Input
          label="Last name"
          placeholder="Last name"
          disabled
          value={user.lastName}
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
      <div className="mb-4 mt-6">
        <Input
          label="Address"
          placeholder="Address"
          disabled
          value={user.address}
        />
      </div>
      <div>
        <Input
          type="email"
          label="Email"
          disabled
          placeholder="Address"
          value={user.email}
        />
      </div>
    </>
  )
}
