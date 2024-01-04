import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { userService } from './lib/api/user'

const isPublicPath = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
  )
}

const publicPaths = ['/auth*']

export async function middleware(req: NextRequest) {
  const isPublic = isPublicPath(req.nextUrl.pathname)
  const nextPage = req.nextUrl.searchParams.get('next')
  const cookieName = process.env.COOKIE_NAME || 'testnet.cookie'
  console.log('test')

  const response = await userService.me(
    `${cookieName}=${req.cookies.get(cookieName)?.value}`
  )

  // Success TRUE - the user is logged in
  if (response.success) {
    // If the user is logged in and has not completed KYC, redirect to KYC page.
    if (
      response.data?.needsWallet &&
      req.nextUrl.pathname !== '/kyc/personal'
    ) {
      const url = new URL('/kyc/personal', req.url)
      url.searchParams.append('next', 'proof')
      return NextResponse.redirect(url)
    }

    if (response.data?.needsIDProof && req.nextUrl.pathname !== '/kyc/proof') {
      if (nextPage !== 'proof')
        return NextResponse.redirect(new URL('/kyc/proof', req.url))
    }

    // If KYC is completed and the user tries to navigate to the page, redirect
    // to homepage.
    if (
      !response.data?.needsIDProof &&
      !response.data?.needsWallet &&
      req.nextUrl.pathname.startsWith('/kyc')
    ) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (isPublic) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  } else {
    // If the user is not logged in and tries to access a private resource,
    // redirect to auth page or in the case of grant-interaction, back to the interaction page.

    if (!isPublic && !response.success) {
      const url = new URL(`/auth/login/`, req.url)
      if (req.nextUrl.pathname !== '') {
        url.searchParams.set(
          'callbackUrl',
          `${req.nextUrl.pathname}${req.nextUrl.search}`
        )
      }
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// A simple trick to avoid running the middleware on all static files.
// Static files have a `.` in the path, while dynamic files do not.
export const config = { matcher: '/((?!_next|.*\\.).*)' }
