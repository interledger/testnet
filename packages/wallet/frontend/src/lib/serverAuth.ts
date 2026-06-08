import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult
} from 'next'
import type { UserResponse } from '@wallet/shared'
import { userService } from '@/lib/api/user'

/**
 * SSR auth architecture note:
 * - Auth gating lives in `getServerSideProps` wrappers (Node runtime), not edge middleware.
 * - Backend URL is read at runtime from container env via `httpClient`.
 * - Pages stay deployment-agnostic and only consume `ctx.user` from these wrappers.
 */

type Props = { [key: string]: unknown }

/** `getServerSideProps` context with authenticated `user` attached. */
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
  if (!me.success) {
    console.error('[serverAuth] resolveUser failed:', me.message)
  }
  return me.success && me.result ? me.result : null
}

/** Protected pages: require auth and completed KYC. */
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

/** KYC page: require auth + needsIDProof=true, otherwise redirect. */
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

/** Guest pages: redirect authenticated users away from auth screens. */
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
