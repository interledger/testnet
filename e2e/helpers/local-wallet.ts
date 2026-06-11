import { createHash, randomBytes } from 'crypto'
import { expect, Page } from '@playwright/test'
import { Client } from 'pg'

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

/**
 * Bypasses email delivery by injecting a known token into the DB, then calling
 * the real /auth/verify/:token endpoint. This ensures gateHubUserId is created
 * via the normal verify flow (which calls MockGatehub createManagedUser).
 */
export async function verifyUserDirectly(
  email: string,
  options?: { dbUrl?: string; apiUrl?: string }
): Promise<void> {
  const connectionString =
    options?.dbUrl ||
    process.env.TEST_DB_URL ||
    'postgres://wallet_backend:wallet_backend@localhost:15434/wallet_backend'
  // Use the direct HTTP port to avoid TLS cert issues in Node.js fetch (Traefik proxy uses a self-signed cert).
  const apiBase =
    options?.apiUrl || process.env.TEST_API_URL || 'http://localhost:3003'

  // Generate a fresh token and store its hash so the verify endpoint can find the user
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query(
      'UPDATE users SET "verifyEmailToken" = $1 WHERE email = $2',
      [tokenHash, email]
    )
  } finally {
    await client.end()
  }

  // Call the real verify endpoint — this creates the GateHub managed user and sets gateHubUserId
  const response = await fetch(`${apiBase}/verify-email/${token}`, {
    method: 'POST',
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Email verification failed (${response.status}): ${body}`)
  }
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

  // Verify email via direct DB update (no email link needed)
  await verifyUserDirectly(credentials.email)
  await ss('007-email-verified')

  // Login
  await page.goto('/auth/login')
  await expect(page).toHaveURL(/\/auth\/login$/)
  await ss('008-login-page-opened')

  const loginForm = page.locator('form')
  await loginForm
    .getByLabel('E-mail *', { exact: true })
    .fill(credentials.email)
  await ss('009-login-email-filled')
  await loginForm
    .getByLabel('Password *', { exact: true })
    .fill(credentials.password)
  await ss('010-login-password-filled')

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/login') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    ),
    loginForm.locator('button[type="submit"]').click()
  ])
  await ss('011-login-submitted')

  await page.waitForURL(/\/(kyc)?$/, { timeout: 60_000 })
  await ss('012-post-login')

  // KYC if needed
  if (page.url().endsWith('/kyc')) {
    await completeLocalMockKyc(page, ss)
  }

  // Verify we're on dashboard
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await ss('013-dashboard-ready')

  return credentials
}
