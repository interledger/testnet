import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/ui/Play'
import { z } from 'zod'
import { useRouter } from 'next/router'

const loginSchema = z.object({
  email: z.string().min(5, { message: 'Email is required' }),
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
      <Form form={loginForm} onSubmit={handleSubmit}>
        <Input
          required
          type="email"
          {...loginForm.register('email')}
          error={loginForm.formState.errors.email?.message}
          placeholder="Email"
        />
        <Input
          required
          type="password"
          {...loginForm.register('password')}
          error={loginForm.formState.errors.password?.message}
          placeholder="Password"
        />
        <button aria-label="login" type="submit" className="m-auto py-10">
          <Play />
        </button>
      </Form>
      <Link
        href="/recover-pswd"
        className="mt-10 text-xs font-extralight text-brand-green-3"
      >
        Forgot password?
      </Link>
      <Link
        href="/register"
        className="mt-auto text-sm font-extralight text-brand-green-4"
      >
        Not a member? Sign in
      </Link>
    </AuthLayout>
  )
}

export default Login
