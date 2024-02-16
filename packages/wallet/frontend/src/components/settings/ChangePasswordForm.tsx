import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { changePasswordSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { getObjectKeys } from '@/utils/helpers'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { usePasswordContext } from '@/lib/context/password'
import { useEffect } from 'react'

export const ChangePasswordForm = () => {
  const changePasswordForm = useZodForm({
    schema: changePasswordSchema
  })
  const [openDialog, closeDialog] = useDialog()
  const { setIsChangePassword } = usePasswordContext()

  useEffect(() => {
    changePasswordForm.setFocus('oldPassword')
  }, [changePasswordForm]);

  return (
    <div className="pt-5">
      <h3 className="text-2xl text-turqoise">Change account password</h3>
      <Form
        form={changePasswordForm}
        onSubmit={async (data) => {
          const response = await userService.changePassword(data)

          if (!response) {
            openDialog(
              <ErrorDialog
                onClose={closeDialog}
                content="Change password failed. Please try again."
              />
            )
            return
          }

          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={() => {
                  closeDialog()
                }}
                content={response.message}
              />
            )
            setIsChangePassword(false)
          } else {
            const { errors, message } = response

            if (errors) {
              getObjectKeys(errors).map((field) =>
                changePasswordForm.setError(field, {
                  message: errors[field]
                })
              )
            }
            if (message) {
              changePasswordForm.setError('root', { message })
            }
          }
        }}
      >
        <Input
          required
          type="password"
          label="Old Password"
          error={changePasswordForm.formState.errors.oldPassword?.message}
          {...changePasswordForm.register('oldPassword')}
        />
        <Input
          required
          type="password"
          label="New Password"
          error={changePasswordForm.formState.errors.newPassword?.message}
          {...changePasswordForm.register('newPassword')}
        />
        <Input
          required
          type="password"
          label="Confirm New Password"
          error={
            changePasswordForm.formState.errors.confirmNewPassword?.message
          }
          {...changePasswordForm.register('confirmNewPassword')}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" aria-label="Save password">
            Save password
          </Button>
        </div>
      </Form>
    </div>
  )
}
