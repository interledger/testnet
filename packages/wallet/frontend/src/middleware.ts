import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Do not use the browser httpClient here; middleware runs in the container.
// Call backend using the internal Docker hostname to validate the session.

const isPublicPath = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
  )
}

const publicPaths = ['/auth*']

export async function middleware(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
  const isPublic = isPublicPath(req.nextUrl.pathname)
  const cookieName = process.env.COOKIE_NAME || 'testnet.cookie'

  const cookieVal = req.cookies.get(cookieName)?.value

  // Build internal backend URL for middleware
  const backendUrl =
    process.env.BACKEND_INTERNAL_URL || 'http://wallet-backend:3003'
  let response: {
    success: boolean
    result?: Record<string, unknown>
    message?: string
  } = {
    success: false
  }
  try {
    const meRes = await fetch(`${backendUrl}/me`, {
      headers: cookieVal ? { Cookie: `${cookieName}=${cookieVal}` } : {}
    })
    const json = await meRes.json()
    response = json
  } catch (e) {
    // Ignore connectivity errors; fallback logic below handles unauthenticated state
  }

  // Success TRUE - the user is logged in
  if (response.success && response.result) {
    // If user KYC is not approved, redirect back to the KYC page.
    if (
      response.result.needsIDProof === true &&
      req.nextUrl.pathname !== '/kyc'
    ) {
      const url = new URL('/kyc', req.url)
      return NextResponse.redirect(url)
    }

    // If KYC is completed and the user tries to navigate to the page, redirect
    // to homepage.
    if (
      response.result.needsIDProof === false &&
      req.nextUrl.pathname.startsWith('/kyc')
    ) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (isPublic) {
      const dest = callbackUrl ?? '/'
      return NextResponse.redirect(new URL(dest, req.url))
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
