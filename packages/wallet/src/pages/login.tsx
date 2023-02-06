import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { Link } from '@/ui/Link'
import { z } from 'zod'

const loginSchema = z.object({
  userName: z.string().min(1),
  password: z.string().min(6)
})

const Login = () => {
  const loginForm = useZodForm({
    schema: loginSchema
  })

  const onSubmit = loginForm.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AuthLayout>
      <HeaderLogo header="Welcome" />
      <h2 className="mt-10 mb-5 text-xl font-semibold text-brand-green-4">
        Login
      </h2>
      <Form form={loginForm} onSubmit={onSubmit}>
        <Input required {...loginForm.register('userName')} />
        <Input required type="password" {...loginForm.register('password')} />
        <Button aria-label="login" type="submit">
          Login
        </Button>
      </Form>
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
