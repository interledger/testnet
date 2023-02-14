import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { z } from 'zod'

const changePasswordSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z.string().min(6, {
      message: 'Your new password has to be at least 6 characters long.'
    }),
    confirmNewPassword: z.string()
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match.',
        path: ['confirmNewPassword']
      })
    }
  })

export const ChangePasswordForm = () => {
  const form = useZodForm({
    schema: changePasswordSchema
  })

  const onSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-brand-turqoise">
          Change account password
        </h3>
      </div>
      <Form form={form} onSubmit={onSubmit}>
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
