import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { Eye } from '@/components/icons/Eye'
import { SlashEye } from '@/components/icons/SlashEye'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import { useEffect, useState } from 'react'
import { loginSchema } from '@wallet/shared'
import { THEME } from '@/utils/constants'

const LoginPage: NextPageWithLayout = () => {
  const [openDialog, closeDialog] = useDialog()
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false)
  const router = useRouter()
  const callBackUrl =
    router.asPath.indexOf('callbackUrl') !== -1
      ? `${router.query?.callbackUrl}`
      : '/'
  const loginForm = useZodForm({
    schema: loginSchema
  })
  const imageName =
    THEME === 'dark' ? '/login-mobile-dark.webp' : '/login-mobile-light.webp'

  async function resendVerifyEmail() {
    const { email } = loginForm.getValues()
    const response = await userService.resendVerifyEmail({ email })

    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={closeDialog}
          title="Email sent."
          content="Please check your inbox. Click on the provided link to validate your email address."
          redirect={'login'}
          redirectText="Go to Login"
        />
      )
    } else {
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Email not sent. Please try again."
        />
      )
    }
  }
  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible)
  }
  useEffect(() => {
    loginForm.setFocus('email')
  }, [loginForm])

  return (
    <>
      <HeaderLogo header="Welcome" />
      <h2 className="mb-5 mt-10 text-xl font-semibold text-green dark:text-teal-neon">
        Login
      </h2>
      <div className="w-2/3">
        <Form
          form={loginForm}
          onSubmit={async (data) => {
            const response = await userService.login(data)

            if (response.success) {
              const isIncorrectCallbackUrl =
                !callBackUrl.startsWith('/') &&
                !callBackUrl.startsWith(window.location.origin)
              isIncorrectCallbackUrl
                ? router.push('/')
                : router.push(callBackUrl)
            } else {
              const { errors, message } = response
              loginForm.setError('root', { message })

              if (errors && errors.email) {
                loginForm.setError('email', { message: errors.email })
              }
            }
          }}
        >
          {loginForm.formState.errors.email ? (
            <Link
              onClick={() => {
                resendVerifyEmail()
              }}
              className="text-sm font-extralight text-green underline dark:text-green-neon"
            >
              Click here to resend verification email
            </Link>
          ) : null}
          <Input
            required
            type="email"
            {...loginForm.register('email')}
            error={loginForm.formState.errors.email?.message}
            label="E-mail"
          />
          <div className="relative">
            <Input
              required
              type={isPasswordVisible ? 'text' : 'password'}
              {...loginForm.register('password')}
              error={loginForm.formState.errors.password?.message}
              label="Password"
            />
            <span
              onClick={togglePasswordVisibility}
              className="absolute right-2.5 top-9 cursor-pointer"
            >
              {isPasswordVisible ? <SlashEye /> : <Eye />}
            </span>
          </div>
          <Link
            href="forgot"
            className="text-sm font-extralight text-green underline dark:text-green-neon"
          >
            Forgot password?
          </Link>
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play
              loading={loginForm.formState.isSubmitting}
              className="text-green dark:text-pink-neon dark:hover:drop-shadow-glow-svg"
            />
          </button>
        </Form>
        <p className="mt-auto text-center font-extralight text-green dark:text-green-neon">
          Not a customer?{' '}
          <Link href="signup" className="font-medium underline">
            Create an account
          </Link>
        </p>
      </div>
      <Image
        className="mt-10 object-cover md:hidden"
        src={imageName}
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
    </>
  )
}

LoginPage.getLayout = function (page) {
  return <AuthLayout image="Login">{page}</AuthLayout>
}

export default LoginPage
