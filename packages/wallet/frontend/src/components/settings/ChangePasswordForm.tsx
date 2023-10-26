import { User, changePasswordSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { SuccessDialog } from '../dialogs/SuccessDialog'

type ChangePasswordProps = {
  user: User
}

export const ChangePasswordForm = ({ user }: ChangePasswordProps) => {
  const [openDialog, closeDialog] = useDialog()
  const form = useZodForm({
    schema: changePasswordSchema
  })

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-turqoise">Change account password</h3>
      </div>
      <Form
        form={form}
        onSubmit={async ({ oldPassword, newPassword, confirmNewPassword }) => {
          const response = await userService.changePassword({
            email: user.email,
            oldPassword,
            newPassword,
            confirmNewPassword
          })
 
          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={closeDialog}
                title="Password updated."
                content="Your password has been updated successfully."
                redirect={'settings'}
              />
            )
            form.reset()
          }
        }}
      >
        <Input
          required
          type="password"
          label="Old Password"
          error={form.formState.errors.oldPassword?.message}
          {...form.register('oldPassword')}
        />
        <Input
          required
          type="password"
          label="New Password"
          error={form.formState.errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <Input
          required
          type="password"
          label="Confirm New Password"
          error={form.formState.errors.confirmNewPassword?.message}
          {...form.register('confirmNewPassword')}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" aria-label="Change password">
            Change password
          </Button>
        </div>
      </Form>
    </>
  )
}
