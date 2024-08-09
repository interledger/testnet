import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { loginSchema, userService } from '@/lib/api/user'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const callBackUrl =
    router.asPath.indexOf('callbackUrl') !== -1
      ? `${router.query?.callbackUrl}`
      : '/'
  const loginForm = useZodForm({
    schema: loginSchema
  })
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark'
      ? '/login-mobile-dark.webp'
      : '/login-mobile-light.webp'

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

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  loginForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <Input
            required
            type="email"
            {...loginForm.register('email')}
            error={loginForm.formState.errors.email?.message}
            label="E-mail"
          />
          <Input
            required
            type="password"
            {...loginForm.register('password')}
            error={loginForm.formState.errors.password?.message}
            label="Password"
          />
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
      </div>
      <Image
        className="mt-auto object-cover md:hidden"
        src={imageName}
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
      <p className="mt-auto text-center font-extralight text-green dark:text-green-neon">
        Not a customer?{' '}
        <Link href="signup" className="font-medium underline">
          Create an account
        </Link>
      </p>
    </>
  )
}

LoginPage.getLayout = function (page) {
  return <AuthLayout image="Login">{page}</AuthLayout>
}

export default LoginPage
