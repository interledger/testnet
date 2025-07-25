import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import { Play } from '@/components/icons/Play'
import { Eye } from '@/components/icons/Eye'
import { SlashEye } from '@/components/icons/SlashEye'
import { userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { useEffect, useState } from 'react'
import { cx } from 'class-variance-authority'
import { signUpSchema } from '@wallet/shared'
import { FEATURES_ENABLED, THEME } from '@/utils/constants'
import { Checkbox } from '@/ui/forms/Checkbox'
import { useRouter } from 'next/router'

const SignUpPage: NextPageWithLayout = () => {
  const [openDialog, closeDialog] = useDialog()
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false)
  const [isRepeatPasswordVisible, setRepeatPasswordVisible] =
    useState<boolean>(false)
  const router = useRouter()

  const signUpForm = useZodForm({
    schema: signUpSchema
  })
  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible)
  }
  const toggleRepeatPasswordVisibility = () => {
    setRepeatPasswordVisible(!isRepeatPasswordVisible)
  }
  useEffect(() => {
    FEATURES_ENABLED ? router.push('/auth/login') : null
    signUpForm.setFocus('email')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signUpForm])

  return (
    <>
      <HeaderLogo header="Welcome" />
      <h2 className="mb-5 mt-2 text-xl text-green dark:text-teal-neon">
        Create Account
      </h2>
      <div className="z-10 w-2/3">
        <Form
          form={signUpForm}
          onSubmit={async (data) => {
            if (FEATURES_ENABLED && !data.acceptedCardTerms) {
              const message =
                'You must agree to the Terms and Conditions before continuing registration'
              signUpForm.setError('root', { message })
              return
            }

            const response = await userService.signUp(data)

            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  content={
                    <div>
                      <h4 className="text-lg font-bold">
                        Welcome to Interledger{' '}
                        {FEATURES_ENABLED ? 'Wallet' : 'Test Wallet'}
                      </h4>
                      <p className="text-xs">
                        A verification link has been sent to your email account.
                      </p>
                      <p className="text-xs">
                        Please click on the link that has just been sent to your
                        email account to verify your email and continue the
                        registration process.
                      </p>
                    </div>
                  }
                  redirect="/auth/login"
                  redirectText="Go to login page"
                />
              )
            } else {
              const { errors, message } = response
              signUpForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  signUpForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <Input
            required
            type="email"
            {...signUpForm.register('email')}
            error={signUpForm.formState.errors.email?.message}
            label="E-mail"
          />
          <div className="relative">
            <Input
              required
              type={isPasswordVisible ? 'text' : 'password'}
              {...signUpForm.register('password')}
              error={signUpForm.formState.errors.password?.message}
              label="Password"
            />
            <span
              onClick={togglePasswordVisibility}
              className="absolute right-2.5 top-9 cursor-pointer"
            >
              {isPasswordVisible ? <SlashEye /> : <Eye />}
            </span>
          </div>
          <div className="relative">
            <Input
              required
              type={isRepeatPasswordVisible ? 'text' : 'password'}
              {...signUpForm.register('confirmPassword')}
              error={signUpForm.formState.errors.confirmPassword?.message}
              label="Confirm password"
            />
            <span
              onClick={toggleRepeatPasswordVisibility}
              className="absolute right-2.5 top-9 cursor-pointer"
            >
              {isRepeatPasswordVisible ? <SlashEye /> : <Eye />}
            </span>
          </div>
          {FEATURES_ENABLED ? (
            <div className="relative cursor-pointer">
              <Checkbox
                {...signUpForm.register('acceptedCardTerms')}
                error={signUpForm.formState.errors.acceptedCardTerms?.message}
                label={
                  <div>
                    By clicking here, I confirm that I have read, understood,
                    and agree with the&nbsp;
                    <a
                      className="underline"
                      target="_blank"
                      href="https://cdn.gatehub.net/docs/General_terms_for_Paywiser_x_GateHub-Mastercard_card_V1.pdf"
                      rel="noreferrer"
                    >
                      Paywiser Terms and Conditions
                    </a>
                    &nbsp;for the use of the Paywiser MasterCard payment card,
                    including the additional terms for card testing and
                    limitations set out therein. I agree to not promote,
                    advertise or post on any social media the Paywiser x GateHub
                    MasterCard payment card without the prior written consent of
                    the card issuer (Paywiser).
                  </div>
                }
              />
            </div>
          ) : null}
          <button
            aria-label="login"
            type="submit"
            className="m-auto py-2 sm:py-5"
          >
            <Play
              loading={signUpForm.formState.isSubmitting}
              className="text-green dark:text-pink-neon dark:hover:drop-shadow-glow-svg"
            />
          </button>
        </Form>
      </div>
      {FEATURES_ENABLED ? null : (
        <div
          className={cx(
            'absolute bottom-0 h-[200px] w-full bg-contain bg-center bg-no-repeat md:hidden',
            THEME === 'dark'
              ? "bg-[url('../../public/leafs-dark.svg')]"
              : "bg-[url('../../public/leafs-light.svg')]"
          )}
        ></div>
      )}
      <p className="z-10 mt-10 text-center font-extralight text-green dark:text-green-neon">
        Already a customer?{' '}
        <Link href="login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </>
  )
}

SignUpPage.getLayout = function (page) {
  return <AuthLayout image="Register">{page}</AuthLayout>
}

export default SignUpPage
