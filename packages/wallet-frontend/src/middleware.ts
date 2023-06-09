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

  // Because this is not going to run in the browser, we have to explictly pass
  // the cookies.
  const response = await userService.me(
    `testnet.cookie=${req.cookies.get('testnet.cookie')?.value}`
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
    // redirect to auth page.
    if (!isPublic && !response.success) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  return NextResponse.next()
}

// A simple trick to avoid running the middleware on all static files.
// Static files have a `.` in the path, while dynamic files do not.
export const config = { matcher: '/((?!_next|.*\\.).*)' }
