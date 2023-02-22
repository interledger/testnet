import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { z } from 'zod'
import { useRouter } from 'next/router'
import Image from 'next/image'

const loginSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(6, { message: 'Password is required, min. 6 chars' })
})

const Login = () => {
  const router = useRouter()

  const loginForm = useZodForm({
    schema: loginSchema
  })

  const handleSubmit = loginForm.handleSubmit((data) => {
    console.log(data)
    router.push('/')
  })

  return (
    <AuthLayout image="Login">
      <HeaderLogo header="Welcome" />
      <h2 className="mt-10 mb-5 text-xl font-semibold text-brand-green-4">
        Login
      </h2>
      <div className="w-2/3">
        <Form form={loginForm} onSubmit={handleSubmit}>
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
            className="text-xs font-extralight text-brand-green-3"
          >
            Forgot password?
          </Link>
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play />
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
      <Link
        href="register"
        className="mt-auto text-sm font-extralight text-brand-green-4"
      >
        Not a customer? Create account
      </Link>
    </AuthLayout>
  )
}

export default Login
