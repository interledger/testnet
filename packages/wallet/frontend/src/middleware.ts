import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { userService } from '@/lib/api/user'
import type { SuccessResponse, ErrorResponse } from '@/lib/httpClient'
import type { UserResponse } from '@wallet/shared'

const isPublicPath = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
  )
}

const publicPaths = ['/auth*']

// When running behind a reverse proxy (e.g. Traefik), Next.js middleware sees
// the internal container URL (http://wallet-frontend:4003) as req.url. This
// causes redirects to point to the internal hostname instead of the public
// domain. We use the standard proxy headers to reconstruct the external origin.
function getExternalBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto')
  const host = req.headers.get('x-forwarded-host')
  if (proto && host) {
    return `${proto}://${host}`
  }
  return req.url
}

export async function middleware(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
  const isPublic = isPublicPath(req.nextUrl.pathname)
  const cookieName = process.env.COOKIE_NAME || 'testnet.cookie'
  const baseUrl = getExternalBaseUrl(req)

  const cookieVal = req.cookies.get(cookieName)?.value

  let response: SuccessResponse<UserResponse> | ErrorResponse = {
    success: false,
    message: ''
  }
  if (cookieVal) {
    try {
      response = await userService.me(`${cookieName}=${cookieVal}`)
    } catch {
      // Ignore connectivity errors; fallback logic below handles unauthenticated state
    }
  }

  // Success TRUE - the user is logged in
  if (response.success && response.result) {
    // If user KYC is not approved, redirect back to the KYC page.
    if (
      response.result.needsIDProof === true &&
      req.nextUrl.pathname !== '/kyc'
    ) {
      const url = new URL('/kyc', baseUrl)
      return NextResponse.redirect(url)
    }

    // If KYC is completed and the user tries to navigate to the page, redirect
    // to homepage.
    if (
      response.result.needsIDProof === false &&
      req.nextUrl.pathname.startsWith('/kyc')
    ) {
      return NextResponse.redirect(new URL('/', baseUrl))
    }

    if (isPublic) {
      const dest =
        callbackUrl &&
        callbackUrl.startsWith('/') &&
        !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/'
      return NextResponse.redirect(new URL(dest, baseUrl))
    }
  } else {
    // If the user is not logged in and tries to access a private resource,
    // redirect to auth page or in the case of grant-interaction, back to the interaction page.

    if (!isPublic && !response.success) {
      const url = new URL(`/auth/login/`, baseUrl)
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
