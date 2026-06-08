import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult
} from 'next'
import type { UserResponse } from '@wallet/shared'
import { userService } from '@/lib/api/user'

/**
 * Server-side authentication gate.
 *
 * This replaces the previous global edge middleware. The edge runtime cannot
 * read arbitrary runtime environment variables (e.g. `BACKEND_INTERNAL_URL`),
 * which forced that value to be inlined at build time and made it impossible to
 * configure per deployment. By gating in `getServerSideProps` instead, the
 * checks run in the Node.js runtime where the backend URL is resolved from the
 * live container environment.
 *
 * The application stays agnostic of any deployment/routing concepts: it only
 * talks to the backend via the runtime-configured internal URL.
 */

type Props = { [key: string]: unknown }

/** A `getServerSideProps` context with the authenticated user attached. */
export type AuthenticatedContext = GetServerSidePropsContext & {
  user: UserResponse
}

type AuthenticatedGssp<P extends Props> = (
  ctx: AuthenticatedContext
) => Promise<GetServerSidePropsResult<P>> | GetServerSidePropsResult<P>

type Gssp<P extends Props> = (
  ctx: GetServerSidePropsContext
) => Promise<GetServerSidePropsResult<P>> | GetServerSidePropsResult<P>

const KYC_PATH = '/kyc'
const LOGIN_PATH = '/auth/login'

function isSafeRelativePath(path: string | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//')
}

async function resolveUser(
  ctx: GetServerSidePropsContext
): Promise<UserResponse | null> {
  const me = await userService.me(ctx.req.headers.cookie)
  return me.success && me.result ? me.result : null
}

/**
 * Protected application pages. Requires an authenticated user that has
 * completed KYC. Unauthenticated users are sent to the login page (preserving
 * the originally requested path as `callbackUrl`); users that still need ID
 * proof are sent to the KYC flow.
 *
 * The wrapped loader receives the validated `user` on its context, so pages do
 * not need to call `userService.me` again.
 */
export function withAuth<P extends Props>(
  gssp?: AuthenticatedGssp<P>
): GetServerSideProps<P> {
  return async (ctx) => {
    const user = await resolveUser(ctx)

    if (!user) {
      const callbackUrl = ctx.resolvedUrl
      const destination = isSafeRelativePath(callbackUrl)
        ? `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : LOGIN_PATH
      return { redirect: { destination, permanent: false } }
    }

    if (user.needsIDProof) {
      return { redirect: { destination: KYC_PATH, permanent: false } }
    }

    if (!gssp) {
      return { props: {} as P }
    }

    return gssp(Object.assign(ctx, { user }))
  }
}

/**
 * The KYC onboarding page. Requires login, and is only reachable while the user
 * still needs ID proof; users that have already completed KYC are redirected to
 * the home page.
 */
export function withKyc<P extends Props>(
  gssp?: AuthenticatedGssp<P>
): GetServerSideProps<P> {
  return async (ctx) => {
    const user = await resolveUser(ctx)

    if (!user) {
      return {
        redirect: {
          destination: `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(KYC_PATH)}`,
          permanent: false
        }
      }
    }

    if (!user.needsIDProof) {
      return { redirect: { destination: '/', permanent: false } }
    }

    if (!gssp) {
      return { props: {} as P }
    }

    return gssp(Object.assign(ctx, { user }))
  }
}

/**
 * Public authentication pages (login, signup, ...). Already-authenticated users
 * are redirected away: to the KYC flow if they still need ID proof, otherwise
 * to their requested `callbackUrl` (or the home page).
 */
export function withGuest<P extends Props>(
  gssp?: Gssp<P>
): GetServerSideProps<P> {
  return async (ctx) => {
    const user = await resolveUser(ctx)

    if (user) {
      if (user.needsIDProof) {
        return { redirect: { destination: KYC_PATH, permanent: false } }
      }
      const callbackUrl = ctx.query.callbackUrl
      const destination =
        typeof callbackUrl === 'string' && isSafeRelativePath(callbackUrl)
          ? callbackUrl
          : '/'
      return { redirect: { destination, permanent: false } }
    }

    if (!gssp) {
      return { props: {} as P }
    }

    return gssp(ctx)
  }
}
