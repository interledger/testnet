// middleware.ts
// import { NextResponse } from 'next/server'
import { HTTPError } from 'ky'
import type { NextRequest } from 'next/server'
import { _ky } from './lib/test'

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => (headers[k] = v))
  console.log(req.headers)
  try {
    const test = await _ky
      .post('me/test', {
        headers
      })
      .json()
  } catch (error) {
    const e = error as HTTPError
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}
