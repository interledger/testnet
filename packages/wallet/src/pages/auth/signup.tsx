import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { signUpSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialog/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { ErrorDialog } from '@/components/dialog/ErrorDialog'

const SignUp = () => {
  const { openDialog, closeDialog } = useDialog()

  const signUpForm = useZodForm({
    schema: signUpSchema
  })

  const handleSubmit = signUpForm.handleSubmit(async (data) => {
    const response = await userService.signUp(data)

    if (!response) {
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Something went wrong. Please try again"
        />
      )
      return
    }

    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={closeDialog}
          content="Your account was created."
          redirect="/auth/login"
          redirectText="Go to login page"
        />
      )
    } else {
      const { errors, message } = response

      if (errors) {
        getObjectKeys(errors).map((field) =>
          signUpForm.setError(field, { message: errors[field] })
        )
      }
      if (message) {
        signUpForm.setError('root', { message })
      }
    }
  })

  return (
    <AuthLayout image="Register">
      <HeaderLogo header="Welcome" />
      <h2 className="mt-10 mb-5 text-xl text-green">Create Account</h2>
      <div className="w-2/3">
        <Form form={signUpForm} onSubmit={handleSubmit}>
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
            <Play />
          </button>
        </Form>
      </div>
      <div className="absolute bottom-0 h-[200px] w-full bg-[url('../../public/leafs.svg')] bg-contain bg-center bg-no-repeat md:hidden"></div>
      <p className="mt-auto font-extralight text-green">
        Already a customer?{' '}
        <Link href="login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default SignUp
