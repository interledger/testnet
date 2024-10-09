import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import Image from 'next/image'
import { Eye } from '@/components/icons/Eye'
import { SlashEye } from '@/components/icons/SlashEye'
import { resetPasswordSchema, userService } from '@/lib/api/user'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { z } from 'zod'
import { useState } from 'react'
import { THEME } from '@/utils/constants'

type ResetPasswordPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const ResetPasswordPage: NextPageWithLayout<ResetPasswordPageProps> = ({
  token,
  isValid
}) => {
  const [openDialog, closeDialog] = useDialog()
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] =
    useState<boolean>(false)
  const resetPasswordForm = useZodForm({
    schema: resetPasswordSchema,
    defaultValues: {
      token: token
    }
  })

  const imageName =
    THEME === 'dark' ? '/bird-envelope-dark.webp' : '/bird-envelope-light.webp'
  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible)
  }
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!isConfirmPasswordVisible)
  }
  return (
    <>
      <HeaderLogo header="Reset Password" />
      {token && isValid ? (
        <>
          <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green dark:text-teal-neon">
            Provide a new password for your Test Wallet account.
          </h2>
          <div className="w-2/3">
            <Form
              form={resetPasswordForm}
              onSubmit={async (data) => {
                const response = await userService.resetPassword(data)

                if (response.success) {
                  openDialog(
                    <SuccessDialog
                      onClose={closeDialog}
                      title="New password set."
                      content="Please login with your new password."
                      redirect={'/auth/login'}
                      redirectText="Go to Login"
                    />
                  )
                } else {
                  const { errors, message } = response
                  resetPasswordForm.setError('root', { message })

                  if (errors) {
                    getObjectKeys(errors).map((field) =>
                      resetPasswordForm.setError(field, {
                        message: errors[field]
                      })
                    )
                  }
                }
              }}
            >
              <div className="relative">
                <Input
                  required
                  type={isPasswordVisible ? 'text' : 'password'}
                  {...resetPasswordForm.register('password')}
                  error={resetPasswordForm.formState.errors.password?.message}
                  label="Password"
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="absolute right-2.5 top-1/2 cursor-pointer"
                >
                  {isPasswordVisible ? <SlashEye /> : <Eye />}
                </span>
              </div>
              <div className="relative">
                <Input
                  required
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  {...resetPasswordForm.register('confirmPassword')}
                  error={
                    resetPasswordForm.formState.errors.confirmPassword?.message
                  }
                  label="Confirm password"
                />
                <span
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-2.5 top-1/2 cursor-pointer"
                >
                  {isConfirmPasswordVisible ? <SlashEye /> : <Eye />}
                </span>
              </div>
              <Input
                required
                type="hidden"
                {...resetPasswordForm.register('token')}
              />
              <div className="flex justify-evenly py-5">
                <Button
                  aria-label="Reset Password"
                  type="submit"
                  loading={resetPasswordForm.formState.isSubmitting}
                >
                  Reset
                </Button>
                <Button intent="outline" aria-label="cancel" href="/auth/login">
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </>
      ) : (
        <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green dark:text-teal-neon">
          The link is invalid or has expired. <br /> Please verify your link, or{' '}
          <Link href="/auth/forgot" className="font-medium underline">
            request a new link
          </Link>{' '}
          to reset password again.
        </h2>
      )}

      <Image
        className="mt-auto object-cover md:hidden"
        src={imageName}
        alt="Forgot password"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-auto text-center font-extralight text-green dark:text-green-neon">
        Remembered your credentials?{' '}
        <Link href="/auth/login" className="font-medium underline">
          Login
        </Link>
      </p>
    </>
  )
}

const querySchema = z.object({
  token: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  token: string
  isValid: boolean
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const checkTokenResponse = await userService.checkToken(
    result.data.token,
    ctx.req.headers.cookie
  )

  if (!checkTokenResponse.success || !checkTokenResponse.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      token: result.data.token,
      isValid: checkTokenResponse.result.isValid
    }
  }
}

ResetPasswordPage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default ResetPasswordPage
