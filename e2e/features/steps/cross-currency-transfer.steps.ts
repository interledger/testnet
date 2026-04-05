import { expect } from '@playwright/test'
import { completeLocalMockKyc, setupVerifiedUser } from '../../helpers/local-wallet'
import { Given, Then, When } from './fixtures'

Given('I am a verified and logged-in wallet user', async ({ page, flow }) => {
  const containerName = flow.containerName

  // Use the helper to quickly set up a verified user
  const credentials = await setupVerifiedUser({
    page,
    takeScreenshot: flow.takeScreenshot,
    containerName,
    skipScreenshots: false
  })

  // Store credentials in flow for later use if needed
  flow.credentials = credentials

  // Validate authenticated access to protected routes; recover by logging in again if needed.
  await page.goto('/send')

  if (page.url().includes('/auth/login')) {
    const loginForm = page.locator('form')

    await loginForm
      .getByLabel('E-mail *', { exact: true })
      .fill(credentials.email)
    await loginForm
      .getByLabel('Password *', { exact: true })
      .fill(credentials.password)

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith('/login') &&
          response.request().method() === 'POST' &&
          response.status() === 200
      ),
      loginForm.locator('button[type="submit"]').click()
    ])

    if (page.url().endsWith('/kyc')) {
      await completeLocalMockKyc(page, flow.takeScreenshot)
      await page.goto('/send')
    } else {
      await page.waitForURL(/\/send$/, { timeout: 60_000 })
    }
  }

  await expect(page).toHaveURL(/\/send$/)
  await flow.takeScreenshot('verified-user-ready')
})

When('I navigate to the send page', async ({ page, flow }) => {
  await page.goto('/send')
  await expect(page).toHaveURL(/\/send$/)
  await expect(page.getByRole('heading', { name: 'Send' })).toBeVisible()
  await flow.takeScreenshot('send-page-loaded')
})

When('I select a source account', async ({ page, flow }) => {
  // Click on the account selector
  const accountSelect = page.locator('#selectAccount')
  await expect(accountSelect).toBeVisible()
  await flow.takeScreenshot('before-select-account')

  await accountSelect.click()
  await flow.takeScreenshot('account-dropdown-opened')

  // Select the first account (EUR Account or whatever is available)
  const firstAccountOption = page.locator('[role="option"]').first()
  await expect(firstAccountOption).toBeVisible()
  await firstAccountOption.click()
  await flow.takeScreenshot('account-selected')
})

Then('I should see the wallet address selector', async ({ page, flow }) => {
  const walletAddressSelect = page.locator('#selectWalletAddress')
  await expect(walletAddressSelect).toBeVisible()
  await flow.takeScreenshot('wallet-address-selector-visible')
})

When('I select a wallet address', async ({ page, flow }) => {
  const walletAddressSelect = page.locator('#selectWalletAddress')
  await expect(walletAddressSelect).toBeVisible()
  await flow.takeScreenshot('before-select-wallet-address')

  await walletAddressSelect.click()
  await flow.takeScreenshot('wallet-address-dropdown-opened')

  // Select the first wallet address option
  const firstWalletOption = page.locator('[role="option"]').first()
  await expect(firstWalletOption).toBeVisible()
  await firstWalletOption.click()
  await flow.takeScreenshot('wallet-address-selected')
})

Then(
  'I should see the recipient address input field',
  async ({ page, flow }) => {
    const recipientInput = page.locator('#addRecipientWalletAddress')
    await expect(recipientInput).toBeVisible()
    await flow.takeScreenshot('recipient-address-input-visible')

    // Verify amount input is also visible
    const amountInput = page.locator('#addAmount')
    await expect(amountInput).toBeVisible()
    await flow.takeScreenshot('amount-input-visible')
  }
)
