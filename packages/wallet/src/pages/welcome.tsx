import AuthLayout from '@/components/layouts/AuthLayout'
import { Button } from '@/ui/Button'
import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'

export default function Welcome() {
  return (
    <AuthLayout>
      <h2 className="mb-10 mt-5 text-xl text-brand-green-3 md:hidden">
        Welcome
      </h2>
      <Logo className="h-28 w-28 flex-shrink-0" />
      <h1 className="hidden space-x-4 text-5xl font-semibold text-brand-green-3 md:mt-10 md:block">
        Welcome
      </h1>
      <h2 className="mt-5 mb-10 text-xl font-light text-brand-green-4 md:mt-20">
        Already a member?
      </h2>
      <Button aria-label="log in" href="/login">
        Log in
      </Button>
      <div className="mt-10 flex w-full items-center">
        <div className="flex-grow border-t border-[#b7eddf]"></div>
        <span className="mx-4 flex-shrink text-brand-green-3">or</span>
        <div className="flex-grow border-t border-[#b7eddf]"></div>
      </div>
      <h2 className="mt-10 mb-5 text-xl font-semibold text-brand-green-4">
        New here?
      </h2>
      <Button aria-label="sign up" href="register">
        Sign up
      </Button>
      <Link
        href="https://interledger.org"
        className="mt-auto text-sm font-extralight text-brand-green-4"
      >
        About Interledger
      </Link>
    </AuthLayout>
  )
}
