import { expect } from '@playwright/test'
import {
  completeLocalMockKyc,
  waitForVerificationLinkFromLogs
} from '../../helpers/local-wallet'
import { Given, Then, When } from './fixtures'

Given('I am a new unique wallet user', async ({ flow }) => {
  expect(flow.credentials.email).toContain('e2e-')
  expect(flow.credentials.password).toContain('Testnet!')
})

When('I open the signup page', async ({ page, flow }) => {
  await page.goto('/auth/signup')
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
  await flow.takeScreenshot('signup-page')
})

When('I complete the signup form', async ({ page, flow }) => {
  const signUpForm = page.locator('form')

  await signUpForm.getByLabel('E-mail *', { exact: true }).fill(flow.credentials.email)
  await flow.takeScreenshot('signup-email-filled')
  await signUpForm.getByLabel('Password *', { exact: true }).fill(flow.credentials.password)
  await flow.takeScreenshot('signup-password-filled')
  await signUpForm
    .getByLabel('Confirm password *', { exact: true })
    .fill(flow.credentials.password)
  await flow.takeScreenshot('signup-confirm-password-filled')
})

When('I submit signup', async ({ page, flow }) => {
  const signUpForm = page.locator('form')

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/signup') &&
        response.request().method() === 'POST' &&
        response.status() === 201
    ),
    signUpForm.locator('button[type="submit"]').click()
  ])

  await flow.takeScreenshot('signup-submitted')
})

Then('I should see signup confirmation', async ({ page, flow }) => {
  await expect(
    page.getByText('A verification link has been sent to your email account.')
  ).toBeVisible()
  await flow.takeScreenshot('signup-success')
})

When('I open the verification link from backend logs', async ({ page, flow }) => {
  const verificationLink = await waitForVerificationLinkFromLogs({
    since: flow.logMarker,
    containerName: flow.containerName
  })

  flow.verificationLink = verificationLink

  await page.goto(verificationLink)
  await flow.takeScreenshot('verification-page-opened')
})

Then('I should see verification success', async ({ page, flow }) => {
  await expect(
    page.getByText('Your email has been verified. Continue to login to use Interledger Test Wallet.')
  ).toBeVisible()
  await flow.takeScreenshot('verify-success')
})

When('I continue to login', async ({ page, flow }) => {
  await page.locator('a[href="/auth/login"]').first().click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  await flow.takeScreenshot('login-page-opened')
})

When('I login with my new credentials', async ({ page, flow }) => {
  const loginForm = page.locator('form')

  await loginForm.getByLabel('E-mail *', { exact: true }).fill(flow.credentials.email)
  await flow.takeScreenshot('login-email-filled')
  await loginForm.getByLabel('Password *', { exact: true }).fill(flow.credentials.password)
  await flow.takeScreenshot('login-password-filled')

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/login') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    ),
    loginForm.locator('button[type="submit"]').click()
  ])

  await flow.takeScreenshot('login-submitted')
  await page.waitForURL(/\/(kyc)?$/, { timeout: 60_000 })
  await flow.takeScreenshot('post-login')
})

When('I complete KYC if I am redirected to KYC', async ({ page, flow }) => {
  if (page.url().endsWith('/kyc')) {
    await completeLocalMockKyc(page, flow.takeScreenshot)
  }
})

Then('I should see the accounts dashboard', async ({ page, flow }) => {
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await expect(page.getByText('Here is your account overview!')).toBeVisible()
  await flow.takeScreenshot('dashboard-confirmed')
})

When('I open the EUR default account', async ({ page, flow }) => {
  const defaultAccount = page
    .locator('a[href*="/account/"]')
    .filter({ hasText: 'EUR Account' })
    .first()

  await expect(defaultAccount).toBeVisible()
  await flow.takeScreenshot('dashboard')
  await defaultAccount.click()
  await flow.takeScreenshot('default-account-opened')
})

Then('I should see the account balance page', async ({ page, flow }) => {
  await expect(page).toHaveURL(/\/account\/.+/)
  await expect(page.getByRole('heading', { name: 'Balance' })).toBeVisible()
  await flow.takeScreenshot('account-page')
})
