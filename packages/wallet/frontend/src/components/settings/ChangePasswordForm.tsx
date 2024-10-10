import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Eye } from '@/components/icons/Eye'
import { SlashEye } from '@/components/icons/SlashEye'
import { changePasswordSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { getObjectKeys } from '@/utils/helpers'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { usePasswordContext } from '@/lib/context/password'
import { useEffect, useState } from 'react'

export const ChangePasswordForm = () => {
  const [isCurrentPasswordVisible, setCurrentPasswordVisible] =
    useState<boolean>(false)
  const [isNewPasswordVisible, setNewPasswordVisible] = useState<boolean>(false)
  const [isConfirmNewPasswordVisible, setConfirmNewPasswordVisible] =
    useState<boolean>(false)

  const changePasswordForm = useZodForm({
    schema: changePasswordSchema
  })
  const [openDialog, closeDialog] = useDialog()
  const { setIsChangePassword } = usePasswordContext()
  const toggleCurrentPasswordVisibility = () => {
    setCurrentPasswordVisible(!isCurrentPasswordVisible)
  }
  const toggleNewPasswordVisibility = () => {
    setNewPasswordVisible(!isNewPasswordVisible)
  }
  const toggleConfirmNewPasswordVisibility = () => {
    setConfirmNewPasswordVisible(!isConfirmNewPasswordVisible)
  }

  useEffect(() => {
    changePasswordForm.setFocus('oldPassword')
  }, [changePasswordForm])

  return (
    <div className="pt-5">
      <h3 className="mb-5 text-2xl text-green dark:text-teal-neon">
        Change account password
      </h3>
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
        <div className="relative">
          <Input
            required
            type={isCurrentPasswordVisible ? 'text' : 'password'}
            label="Old Password"
            error={changePasswordForm.formState.errors.oldPassword?.message}
            {...changePasswordForm.register('oldPassword')}
          />
          <span
            onClick={toggleCurrentPasswordVisibility}
            className="absolute right-2.5 top-9 cursor-pointer"
          >
            {isCurrentPasswordVisible ? <SlashEye /> : <Eye />}
          </span>
        </div>
        <div className="relative">
          <Input
            required
            type={isNewPasswordVisible ? 'text' : 'password'}
            label="New Password"
            error={changePasswordForm.formState.errors.newPassword?.message}
            {...changePasswordForm.register('newPassword')}
          />
          <span
            onClick={toggleNewPasswordVisibility}
            className="absolute right-2.5 top-9 cursor-pointer"
          >
            {isNewPasswordVisible ? <SlashEye /> : <Eye />}
          </span>
        </div>
        <div className="relative">
          <Input
            required
            type={isConfirmNewPasswordVisible ? 'text' : 'password'}
            label="Confirm New Password"
            error={
              changePasswordForm.formState.errors.confirmNewPassword?.message
            }
            {...changePasswordForm.register('confirmNewPassword')}
          />
          <span
            onClick={toggleConfirmNewPasswordVisibility}
            className="absolute right-2.5 top-9 cursor-pointer"
          >
            {isConfirmNewPasswordVisible ? <SlashEye /> : <Eye />}
          </span>
        </div>
        <div className="mt-2 flex justify-end">
          <Button type="submit" aria-label="Save password">
            Save password
          </Button>
        </div>
      </Form>
    </div>
  )
}
