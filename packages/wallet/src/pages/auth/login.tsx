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
import { useState } from 'react'

const Login = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const loginForm = useZodForm({
    schema: loginSchema
  })

  return (
    <AuthLayout image="Login">
      <HeaderLogo header="Welcome" />
      <h2 className="mt-10 mb-5 text-xl font-semibold text-green">Login</h2>
      <div className="w-2/3">
        <Form
          form={loginForm}
          onSubmit={async (data) => {
            setIsLoading(true)
            const response = await userService.login(data)

            if (response.success) {
              router.push('/')
            } else {
              const { errors, message } = response
              loginForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  loginForm.setError(field, { message: errors[field] })
                )
              }
            }
            setIsLoading(false)
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
            href="/recover-pswd"
            className="text-sm font-extralight text-green-3 underline"
          >
            Forgot password?
          </Link>
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play loading={isLoading} />
          </button>
        </Form>
      </div>
      <Image
        className="mt-auto object-cover md:hidden"
        src="/login-mobile.webp"
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
      <p className="mt-auto font-extralight text-green">
        Not a customer?{' '}
        <Link href="signup" className="font-medium underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
