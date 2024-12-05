import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import Image from 'next/image'
import { userService } from '@/lib/api/user'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { useEffect } from 'react'
import { emailSchema } from '@wallet/shared'
import { THEME } from '@/utils/constants'

const ForgotPasswordPage: NextPageWithLayout = () => {
  const [openDialog, closeDialog] = useDialog()
  const forgotPasswordForm = useZodForm({
    schema: emailSchema
  })

  const imageName =
    THEME === 'dark' ? '/bird-envelope-dark.webp' : '/bird-envelope-light.webp'

  useEffect(() => {
    forgotPasswordForm.setFocus('email')
  }, [forgotPasswordForm])

  return (
    <>
      <HeaderLogo header="Forgot Password" />
      <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green dark:text-teal-neon">
        You are not alone. We have all been here at some point.
      </h2>
      <div className="w-2/3">
        <Form
          form={forgotPasswordForm}
          onSubmit={async (data) => {
            const response = await userService.forgotPassword(data)

            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  title="Email sent."
                  content="Please check your inbox. Click on the provided link and reset your password."
                  redirect={'login'}
                  redirectText="Go to Login"
                />
              )
            } else {
              const { errors, message } = response
              forgotPasswordForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  forgotPasswordForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <Input
            required
            type="email"
            {...forgotPasswordForm.register('email')}
            error={forgotPasswordForm.formState.errors.email?.message}
            label="E-mail"
          />
          <div className="flex flex-col justify-between gap-1 py-5 md:flex-row md:text-sm md:justify-between">
            <Button
              aria-label="Forgot Password"
              type="submit"
              loading={forgotPasswordForm.formState.isSubmitting}
            >
              Get reset password link
            </Button>
            <Button intent="outline" aria-label="cancel" href="login">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 object-cover md:hidden"
        src={imageName}
        alt="Forgot password"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-10 text-center font-extralight text-green dark:text-green-neon">
        Remembered your credentials?{' '}
        <Link href="login" className="font-medium underline">
          Login
        </Link>
      </p>
    </>
  )
}

ForgotPasswordPage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default ForgotPasswordPage
