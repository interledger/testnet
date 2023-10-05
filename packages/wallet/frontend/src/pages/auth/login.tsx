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

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const callBackUrl =
    router.asPath.indexOf('callbackUrl') !== -1
      ? `${router.query?.callbackUrl}`
      : '/'
  const loginForm = useZodForm({
    schema: loginSchema
  })

  return (
    <>
      <HeaderLogo header="Welcome" />
      <h2 className="mb-5 mt-10 text-xl font-semibold text-green">Login</h2>
      <div className="w-2/3">
        <Form
          form={loginForm}
          onSubmit={async (data) => {
            const response = await userService.login(data)

            if (response.success) {
              router.push(callBackUrl)
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
            className="text-sm font-extralight text-green-3 underline"
          >
            Forgot password?
          </Link>
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play loading={loginForm.formState.isSubmitting} />
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
        <button className='w-4 h-4 scale-150 flex items-center text-[#7acebe] absolute top-10 left-20' onClick={()=>{
          router.back();
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 78.415 98.02" enableBackground="new 0 0 78.415 78.416" xmlSpace="preserve"><g><g><path fill="#7acebe" d="M0,39.208c0,21.654,17.554,39.208,39.208,39.208c21.653,0,39.207-17.554,39.207-39.208S60.861,0,39.208,0    C17.554,0,0,17.554,0,39.208z M24.924,36.816l18.511-18.512c0.66-0.66,1.525-0.99,2.391-0.99s1.731,0.33,2.391,0.99    c1.316,1.319,1.32,3.458,0,4.777L32.088,39.209l16.128,16.125c1.316,1.32,1.316,3.459,0,4.777c-1.32,1.32-3.461,1.32-4.775,0    L24.924,41.598C23.604,40.278,23.604,38.136,24.924,36.816z"/></g></g></svg>
        </button>
      </p>
    </>
  )
}

LoginPage.getLayout = function (page) {
  return <AuthLayout image="Login">{page}</AuthLayout>
}

export default LoginPage
