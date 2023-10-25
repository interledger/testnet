import { HeaderLogo } from '@/components/HeaderLogo'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import AuthLayout from '@/components/layouts/AuthLayout'
import { forgotPasswordSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { Link } from '@/ui/Link'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { getObjectKeys } from '@/utils/helpers'
import Image from 'next/image'

const ForgotPasswordPage: NextPageWithLayout = () => {
  const [openDialog, closeDialog] = useDialog()
  const forgotPasswordForm = useZodForm({
    schema: forgotPasswordSchema
  })

  return (
    <>
      <HeaderLogo header="Forgot Password" />
      <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green">
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
          <div className="flex justify-evenly py-5">
            <Button
              aria-label="Forgot Password"
              type="submit"
              loading={forgotPasswordForm.formState.isSubmitting}
            >
              Get reset password link
            </Button>
            <Button intent="secondary" aria-label="cancel" href="login">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-auto object-cover md:hidden"
        src="/welcome-mobile.webp"
        alt="Forgot password"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-auto font-extralight text-green">
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
