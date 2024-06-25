import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { signUpSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { useEffect } from 'react'
import { cx } from 'class-variance-authority'
import { useTheme } from 'next-themes'

const SignUpPage: NextPageWithLayout = () => {
  const [openDialog, closeDialog] = useDialog()
  const theme = useTheme()

  const signUpForm = useZodForm({
    schema: signUpSchema
  })
  useEffect(() => {
    signUpForm.setFocus('email')
  }, [signUpForm])

  return (
    <>
      <HeaderLogo header="Welcome" />
      <h2 className="mb-5 mt-10 text-xl text-green">Create Account</h2>
      <div className="z-10 w-2/3">
        <Form
          form={signUpForm}
          onSubmit={async (data) => {
            const response = await userService.signUp(data)

            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  content={
                    <div>
                      <h4 className="text-lg font-bold">
                        Welcome to Interledger Test Wallet
                      </h4>
                      <p className="text-xs">
                        A verification link has been sent to your email account.
                      </p>
                      <p className="text-xs">
                        Please click on the link that has just been sent to your
                        email account to verify your email and continue the
                        registration process.
                      </p>
                    </div>
                  }
                  redirect="/auth/login"
                  redirectText="Go to login page"
                />
              )
            } else {
              const { errors, message } = response
              signUpForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  signUpForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <Input
            required
            type="email"
            {...signUpForm.register('email')}
            error={signUpForm.formState.errors.email?.message}
            label="E-mail"
          />
          <Input
            required
            type="password"
            {...signUpForm.register('password')}
            error={signUpForm.formState.errors.password?.message}
            label="Password"
          />
          <Input
            required
            type="password"
            {...signUpForm.register('confirmPassword')}
            error={signUpForm.formState.errors.confirmPassword?.message}
            label="Confirm password"
          />
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play loading={signUpForm.formState.isSubmitting} />
          </button>
        </Form>
      </div>
      <div
        className={cx(
          'absolute bottom-0 h-[200px] w-full  bg-contain bg-center bg-no-repeat md:hidden',
          theme.theme === 'dark'
            ? "bg-[url('../../public/leafs-dark.svg')]"
            : "bg-[url('../../public/leafs-light.svg')]"
        )}
      ></div>
      <p className="z-10 mt-auto font-extralight text-green">
        Already a customer?{' '}
        <Link href="login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </>
  )
}

SignUpPage.getLayout = function (page) {
  return <AuthLayout image="Register">{page}</AuthLayout>
}

export default SignUpPage
