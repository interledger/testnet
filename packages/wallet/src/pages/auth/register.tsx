import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { z } from 'zod'
import { useRouter } from 'next/router'

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Email is required' }),
    password: z
      .string()
      .min(6, { message: 'Password is required, min. 6 chars' }),
    confirmPassword: z.string()
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match',
        path: ['confirmPassword']
      })
    }
  })

const Register = () => {
  const router = useRouter()

  const registerForm = useZodForm({
    schema: registerSchema
  })

  const handleSubmit = registerForm.handleSubmit((data) => {
    console.log(data)
    router.push('auth/login')
  })

  return (
    <AuthLayout image="Register">
      <HeaderLogo header="Welcome" />
      <h2 className="mt-10 mb-5 text-xl text-green">Create Account</h2>
      <div className="w-2/3">
        <Form form={registerForm} onSubmit={handleSubmit}>
          <Input
            required
            type="email"
            {...registerForm.register('email')}
            error={registerForm.formState.errors.email?.message}
            label="E-mail"
          />
          <Input
            required
            type="password"
            {...registerForm.register('password')}
            error={registerForm.formState.errors.password?.message}
            label="Password"
          />
          <Input
            required
            type="password"
            {...registerForm.register('confirmPassword')}
            error={registerForm.formState.errors.confirmPassword?.message}
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

export default Register
