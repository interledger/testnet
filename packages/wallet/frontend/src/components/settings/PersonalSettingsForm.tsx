import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { useEffect, useState } from 'react'
import { profileSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { getObjectKeys } from '@/utils/helpers'
import { ChangePasswordForm } from './ChangePasswordForm'
import { usePasswordContext } from '@/lib/context/password'
import { UserResponse } from '@wallet/shared'

type PersonalSettingsFormProps = {
  user: UserResponse
}

// TODO: Can these details be updated by the user when switching to GateHub?
export const PersonalSettingsForm = ({ user }: PersonalSettingsFormProps) => {
  const [isReadOnly, setIsReadOnly] = useState(true)
  const { isChangePassword, setIsChangePassword } = usePasswordContext()
  const [openDialog, closeDialog] = useDialog()
  const profileForm = useZodForm({
    schema: profileSchema,
    defaultValues: user
  })

  useEffect(() => {
    profileForm.setFocus('firstName')
  }, [isReadOnly, profileForm])

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-green dark:text-teal-neon">Profile</h3>
      </div>
      <Form
        form={profileForm}
        onSubmit={async (data) => {
          const response = await userService.updateProfile(data)

          if (!response) {
            openDialog(
              <ErrorDialog
                onClose={closeDialog}
                content="Update profile failed. Please try again."
              />
            )
            return
          }

          if (response.success) {
            setIsReadOnly(!isReadOnly)
          } else {
            const { errors, message } = response

            if (errors) {
              getObjectKeys(errors).map((field) =>
                profileForm.setError(field, {
                  message: errors[field]
                })
              )
            }
            if (message) {
              profileForm.setError('root', { message })
            }
          }
        }}
        readOnly={isReadOnly}
      >
        <Input
          required
          label="First name"
          placeholder="First name"
          error={profileForm.formState.errors.firstName?.message}
          {...profileForm.register('firstName')}
        />
        <Input
          required
          label="Last name"
          placeholder="Last name"
          error={profileForm.formState.errors.lastName?.message}
          {...profileForm.register('lastName')}
        />

        {!isReadOnly && (
          <div className="mt-2 flex justify-between">
            <Button
              intent="outline"
              aria-label="stop editing"
              onClick={() => setIsReadOnly(!isReadOnly)}
            >
              Close editing
            </Button>
            <Button
              type="submit"
              aria-label="save personal settings"
              loading={profileForm.formState.isSubmitting}
            >
              Save profile
            </Button>
          </div>
        )}
      </Form>
      {isReadOnly && (
        <div className="mt-4 flex justify-between">
          <Button
            intent="primary"
            aria-label="edit personal details"
            onClick={() => {
              setIsReadOnly(!isReadOnly)
              setIsChangePassword(false)
            }}
          >
            Edit
          </Button>
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
      )}
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
