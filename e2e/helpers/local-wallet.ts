import { expect, Page } from '@playwright/test'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

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

export async function waitForVerificationLinkFromLogs(args: {
  since: Date
  containerName?: string
  timeoutMs?: number
  pollIntervalMs?: number
}): Promise<string> {
  const containerName = args.containerName || 'wallet-backend-local'
  const timeoutMs = args.timeoutMs ?? 30_000
  const pollIntervalMs = args.pollIntervalMs ?? 1_000
  const deadline = Date.now() + timeoutMs
  const linkPattern =
    /Verify email link is:\s+(https?:\/\/\S+\/auth\/verify\/[a-f0-9]+)/g

  while (Date.now() < deadline) {
    let output = ''

    try {
      const result = await execFileAsync(
        'docker',
        [
          'logs',
          '--since',
          args.since.toISOString(),
          '--timestamps',
          containerName
        ],
        { maxBuffer: 1024 * 1024 }
      )

      output = `${result.stdout}\n${result.stderr}`
    } catch (error) {
      const execError = error as NodeJS.ErrnoException & {
        stdout?: string
        stderr?: string
      }

      if (execError.code === 'ENOENT') {
        throw new Error(
          'docker CLI is required to retrieve local verification links'
        )
      }

      output = `${execError.stdout ?? ''}\n${execError.stderr ?? ''}`
    }

    const matches = [...output.matchAll(linkPattern)]
    const latestMatch = matches.at(-1)?.[1]

    if (latestMatch) {
      return latestMatch
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(
    `Timed out waiting for a verification link in docker logs for container ${containerName}`
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
  containerName: string
  skipScreenshots?: boolean
}): Promise<Credentials> {
  const { page, takeScreenshot, containerName, skipScreenshots = false } = args
  const credentials = createUniqueCredentials()
  const logMarker = new Date()

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
  const verificationLink = await waitForVerificationLinkFromLogs({
    since: logMarker,
    containerName
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
