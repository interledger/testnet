import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SuccessResponse } from './lib/axios'
import type { UserData } from './lib/api/user'

const isPublicPath = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
  )
}

const publicPaths = ['/auth*']

export async function middleware(req: NextRequest) {
  const isPublic = isPublicPath(req.nextUrl.pathname)

  // Because this is not going to run in the browser, we have to explictly pass
  // the headers and cookies to send them through.
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => (headers[k] = v))

  // We can not use axios in middleware because it's using XMLHttpRequest.
  const response = await fetch('http://localhost:3003/me', {
    headers
  })

  // Status 200 - the user is logged in
  if (response.status === 200) {
    const { data } = (await response.json()) as SuccessResponse<UserData>

    // If the user is logged in and has not completed KYC, redirect to KYC page.
    if (!data?.noKyc && req.nextUrl.pathname !== '/kyc') {
      return NextResponse.redirect(new URL('/kyc', req.url))
    }

    // If KYC is completed and the user tries to navigate to the page, redirect
    // to homepage.
    if (isPublic || req.nextUrl.pathname === '/kyc') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  } else {
    // If the user is not logged in and tries to access a private resource,
    // redirect to auth page.
    if (!isPublic && response.status !== 200) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  return NextResponse.next()
}

// Avoid running the middleware for static assets.
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)'
}
