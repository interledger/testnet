import { expect, Page } from '@playwright/test'

type ScreenshotFn = (name: string) => Promise<void>

export type Credentials = {
  email: string
  password: string
}

export function createUniqueCredentials(): Credentials {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`

  return {
    email: `e2e-${suffix}@ilp.com`,
    password: `Testnet!${suffix}Aa`
  }
}

type MailslurperMailItem = {
  id: string
  subject: string
  toAddresses: string[]
  body: string
}

type MailslurperResponse = {
  mailItems: MailslurperMailItem[] | null
  totalRecords: number
}

export async function waitForVerificationLinkFromMailslurper(args: {
  toAddress: string
  mailslurperBaseUrl?: string
  timeoutMs?: number
  pollIntervalMs?: number
}): Promise<string> {
  const apiUrl =
    args.mailslurperBaseUrl ||
    process.env.MAILSLURPER_BASE_URL ||
    'http://localhost:4437'
  const timeoutMs = args.timeoutMs ?? 30_000
  const pollIntervalMs = args.pollIntervalMs ?? 1_000
  const deadline = Date.now() + timeoutMs
  const linkPattern = /https?:\/\/\S+\/auth\/verify\/[a-f0-9]+/g

  while (Date.now() < deadline) {
    const response = await fetch(`${apiUrl}/mail?page=1&limit=50`, {
      headers: { Accept: 'application/json' }
    }).catch(() => null)

    if (response?.ok) {
      const data: MailslurperResponse = await response.json()
      const items = data.mailItems ?? []

      // Email addresses are unique per test run so date filtering is not needed.
      const matching = items.filter((item) =>
        item.toAddresses.includes(args.toAddress)
      )

      for (const item of matching) {
        const matches = [...item.body.matchAll(linkPattern)]
        const link = matches.at(-1)?.[0]
        if (link) {
          return link
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(
    `Timed out waiting for a verification email to ${args.toAddress} in mailslurper`
  )
}

export async function completeLocalMockKyc(
  page: Page,
  takeScreenshot: ScreenshotFn
): Promise<void> {
  await expect(page).toHaveURL(/\/kyc$/)
  await takeScreenshot('kyc-page-loaded')

  const frame = page.frameLocator('iframe')

  await frame.getByLabel('First Name').fill('E2E')
  await takeScreenshot('kyc-first-name-filled')
  await frame.getByLabel('Last Name').fill('User')
  await takeScreenshot('kyc-last-name-filled')
  await frame.getByLabel('Date of Birth').fill('1990-01-01')
  await takeScreenshot('kyc-date-of-birth-filled')
  await frame.getByLabel('Address').fill('1 Test Lane')
  await takeScreenshot('kyc-address-filled')
  await frame.getByLabel('City').fill('Basel')
  await takeScreenshot('kyc-city-filled')
  await frame.getByLabel('Country').fill('Switzerland')
  await takeScreenshot('kyc-country-filled')

  await Promise.all([
    page.waitForURL(/\/$/, { timeout: 60_000 }),
    frame.locator('#submitBtn').click()
  ])

  await takeScreenshot('kyc-submitted')
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await takeScreenshot('kyc-dashboard-visible')
}

/**
 * Complete the full signup, email verification, login, and KYC flow for a test user.
 * Returns the credentials used so they can be reused for API calls if needed.
 * Leaves the user logged in on the dashboard.
 */
export async function setupVerifiedUser(args: {
  page: Page
  takeScreenshot: (name: string) => Promise<void>
  skipScreenshots?: boolean
}): Promise<Credentials> {
  const { page, takeScreenshot, skipScreenshots = false } = args
  const credentials = createUniqueCredentials()

  const ss = skipScreenshots ? async () => {} : takeScreenshot

  // Signup
  await page.goto('/auth/signup')
  await ss('001-signup-page')
  const signUpForm = page.locator('form')
  await signUpForm
    .getByLabel('E-mail *', { exact: true })
    .fill(credentials.email)
  await ss('002-signup-email-filled')
  await signUpForm
    .getByLabel('Password *', { exact: true })
    .fill(credentials.password)
  await ss('003-signup-password-filled')
  await signUpForm
    .getByLabel('Confirm password *', { exact: true })
    .fill(credentials.password)
  await ss('004-signup-confirm-password-filled')

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/signup') &&
        response.request().method() === 'POST' &&
        response.status() === 201
    ),
    signUpForm.locator('button[type="submit"]').click()
  ])
  await ss('005-signup-submitted')

  await expect(
    page.getByText('A verification link has been sent to your email account.')
  ).toBeVisible()
  await ss('006-signup-success')

  // Verify email
  const verificationLink = await waitForVerificationLinkFromMailslurper({
    toAddress: credentials.email
  })

  await page.goto(verificationLink)
  await ss('007-verification-page-opened')
  await expect(
    page.getByText(
      'Your email has been verified. Continue to login to use Interledger Test Wallet.'
    )
  ).toBeVisible()
  await ss('008-verify-success')

  // Login
  await page.locator('a[href="/auth/login"]').first().click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  await ss('009-login-page-opened')

  const loginForm = page.locator('form')
  await loginForm
    .getByLabel('E-mail *', { exact: true })
    .fill(credentials.email)
  await ss('010-login-email-filled')
  await loginForm
    .getByLabel('Password *', { exact: true })
    .fill(credentials.password)
  await ss('011-login-password-filled')

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/login') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    ),
    loginForm.locator('button[type="submit"]').click()
  ])
  await ss('012-login-submitted')

  await page.waitForURL(/\/(kyc)?$/, { timeout: 60_000 })
  await ss('013-post-login')

  // KYC if needed
  if (page.url().endsWith('/kyc')) {
    await completeLocalMockKyc(page, ss)
  }

  // Verify we're on dashboard
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await ss('014-dashboard-ready')

  return credentials
}
