import { changePasswordSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { SuccessDialog } from '../dialogs/SuccessDialog'

export const ChangePasswordForm = () => {
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
        onSubmit={async (data) => {
          const response = await userService.changePassword(data)

          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={closeDialog}
                title="Password updated sucessfully."
                content="Please check your inbox. Click on the provided link and reset your password."
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
