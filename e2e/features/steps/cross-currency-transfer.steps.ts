import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  completeLocalMockKyc,
  setupVerifiedUser
} from '../../helpers/local-wallet'
import { Given, Then, When } from './fixtures'

const EPSILON = 0.05

function parseAmountFromText(text: string): number {
  const normalized = text.replace(/,/g, '').replace(/[^0-9.]/g, '')
  const parsed = Number.parseFloat(normalized)

  if (Number.isNaN(parsed)) {
    throw new Error(`Unable to parse amount from text: "${text}"`)
  }

  return parsed
}

type TransactionMatch = {
  direction: 'debit' | 'credit'
  amount: number
}

/**
 * Poll a per-account transactions page (reloading between attempts) until a row
 * matching the given predicate appears. Cross-currency payments settle via ILP
 * webhooks, so the transaction may not be present on first render.
 */
async function findTransaction(
  page: Page,
  predicate: (match: TransactionMatch) => boolean
): Promise<TransactionMatch | null> {
  // Cross-currency payments can take a while to settle; poll (reloading between
  // attempts) until a matching row appears, checking after every reload.
  for (let attempt = 0; attempt < 20; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(3000)
      await page.reload()
      await expect(page).toHaveURL(/\/transactions/)
      await expect(
        page.getByRole('heading', { name: 'Transactions' })
      ).toBeVisible()
    }

    const rows = page.locator('#transactionsList tbody tr.cursor-pointer')
    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      const amountText = (
        await rows.nth(i).locator('td').nth(2).innerText()
      ).trim()
      const match: TransactionMatch = {
        direction: amountText.startsWith('-') ? 'debit' : 'credit',
        amount: parseAmountFromText(amountText)
      }
      if (predicate(match)) {
        return match
      }
    }
  }

  return null
}

Given('I am a verified and logged-in wallet user', async ({ page, flow }) => {
  // Use the helper to quickly set up a verified user
  const credentials = await setupVerifiedUser({
    page,
    takeScreenshot: flow.takeScreenshot,
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

// --- Cross-currency payment scenario ---

Given(
  'I have a source wallet address configured backed by a EUR account',
  async ({ page, flow }) => {
    // A managed user is provisioned with a default "EUR Account" and a wallet
    // address on it during the verify/KYC flow, so we only need to locate it.
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

    const eurAccount = page
      .locator('a[href*="/account/"]')
      .filter({ hasText: 'EUR Account' })
      .first()

    await expect(eurAccount).toBeVisible()
    await eurAccount.click()

    await expect(page).toHaveURL(/\/account\/.+/)
    await expect(page.getByRole('heading', { name: 'Balance' })).toBeVisible()

    const url = new URL(page.url())
    flow.eurAccountPath = `${url.pathname}${url.search}`
    flow.eurAccountId = url.pathname.split('/account/')[1]

    // Confirm the default wallet address exists for this account.
    const sourcePointer = page.locator('p.decoration-dashed').first()
    await expect(sourcePointer).toBeVisible()

    await flow.takeScreenshot('eur-source-account-ready')
  }
)

Given(
  "I've deposited 100.00 EUR into my EUR account",
  async ({ page, flow }) => {
    if (!flow.eurAccountPath) {
      throw new Error('Missing EUR account path in flow state')
    }

    await page.goto(flow.eurAccountPath)
    await expect(page.locator('#fund')).toBeVisible()
    await page.locator('#fund').click()

    await expect(page.getByText('Deposit to Account')).toBeVisible()
    await page.getByLabel('Amount').fill('100.00')
    await flow.takeScreenshot('eur-deposit-dialog-filled')

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/fund') &&
          response.request().method() === 'POST' &&
          response.status() >= 200 &&
          response.status() < 300
      ),
      page.locator('button[aria-label="deposit"]').click()
    ])

    await expect(page.getByText('Deposit success')).toBeVisible()
    await flow.takeScreenshot('eur-deposit-success')

    // Let the deposit webhook settle before we start a payment against it.
    await page.waitForTimeout(4000)
  }
)

Given(
  'I have a second wallet address configured backed by a USD account',
  async ({ page, flow }) => {
    // Create a USD account.
    await page.goto('/account/create')
    await expect(
      page.getByRole('heading', { name: 'Create a new account' })
    ).toBeVisible()

    await page.getByLabel('Account name').fill('USD Account')

    // Open the asset react-select and pick USD.
    const assetField = page
      .locator('#createAccountForm div.space-y-1')
      .filter({ has: page.locator('label', { hasText: 'Asset' }) })
    await assetField.click()
    await page.getByRole('option', { name: 'USD', exact: true }).click()
    await flow.takeScreenshot('usd-account-form-filled')

    await page.getByRole('button', { name: 'create account' }).click()
    await expect(page.getByText('Account created.')).toBeVisible()
    await flow.takeScreenshot('usd-account-created')

    await page.locator('#redirectButtonSuccess').click()
    await expect(page).toHaveURL(/\/account\/.+/)
    await expect(page.getByRole('heading', { name: 'Balance' })).toBeVisible()

    const url = new URL(page.url())
    flow.usdAccountPath = `${url.pathname}${url.search}`
    flow.usdAccountId = url.pathname.split('/account/')[1]

    // Add a wallet address to the USD account.
    await page.locator('#walletAddress').click()
    await expect(
      page.getByRole('heading', { name: 'Create Wallet Address' })
    ).toBeVisible()

    // Wallet address names allow only [a-z1-9_-] (note: no zero), so strip any
    // disallowed characters (hyphens, zeros, non-hex) from the account id.
    const suffix = (flow.usdAccountId ?? '')
      .toLowerCase()
      .replace(/[^a-z1-9]/g, '')
    await page.getByLabel('Wallet Address name').fill(`usde2e${suffix}`)
    await page.getByLabel('Public name').fill('USD E2E')
    await flow.takeScreenshot('usd-wallet-address-form-filled')

    await page.getByRole('button', { name: 'create payment pointer' }).click()

    // Dialog closes and the page reloads showing the new wallet address.
    await expect(
      page.getByRole('heading', { name: 'Create Wallet Address' })
    ).toBeHidden()

    const usdPointer = page.locator('p.decoration-dashed').first()
    await expect(usdPointer).toBeVisible()
    flow.usdWalletAddressUrl = (await usdPointer.innerText()).trim()

    if (!flow.usdWalletAddressUrl) {
      throw new Error('Failed to read USD wallet address URL')
    }

    await flow.takeScreenshot('usd-wallet-address-ready')
  }
)

When(
  'I select the EUR source account by wallet address',
  async ({ page, flow }) => {
    const accountSelect = page.locator('#selectAccount')
    await expect(accountSelect).toBeVisible()
    await accountSelect.click()

    const eurOption = page
      .locator('[role="option"]')
      .filter({ hasText: '(EUR)' })
      .first()
    await expect(eurOption).toBeVisible()
    await eurOption.click()
    await flow.takeScreenshot('send-eur-account-selected')

    const walletAddressSelect = page.locator('#selectWalletAddress')
    await expect(walletAddressSelect).toBeVisible()
    await walletAddressSelect.click()

    const firstWalletOption = page.locator('[role="option"]').first()
    await expect(firstWalletOption).toBeVisible()
    await firstWalletOption.click()
    await flow.takeScreenshot('send-eur-wallet-address-selected')
  }
)

When(
  'I select the USD destination account by wallet address',
  async ({ page, flow }) => {
    if (!flow.usdWalletAddressUrl) {
      throw new Error('Missing USD wallet address URL in flow state')
    }

    const recipientInput = page.locator('#addRecipientWalletAddress')
    await expect(recipientInput).toBeVisible()
    await recipientInput.fill(flow.usdWalletAddressUrl)

    // The recipient field is debounced (1s) and then resolves the wallet
    // address; wait for it to validate (no error shown).
    await page.waitForTimeout(2000)
    await expect(
      page.getByText('Please check that the Wallet Address is correct')
    ).toHaveCount(0)
    await flow.takeScreenshot('send-usd-destination-entered')
  }
)

When('I enter a payment amount of 10.00 EUR', async ({ page, flow }) => {
  // Switch from the default "receive" mode to "send" mode so the entered
  // amount is the debit amount in the source (EUR) currency.
  const toggle = page.locator('#sendReceive')
  await expect(toggle).toBeVisible()
  if ((await toggle.getAttribute('aria-checked')) === 'true') {
    await toggle.click()
  }

  const amountInput = page.locator('#addAmount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('10')
  await flow.takeScreenshot('send-amount-entered')
})

When('I submit the payment', async ({ page, flow }) => {
  await page.locator('button[aria-label="Pay"]').click()

  // The quote is fetched, then the confirmation dialog appears.
  await expect(page.locator('#acceptQuote')).toBeVisible({ timeout: 30_000 })
  await flow.takeScreenshot('send-quote-dialog')
})

Then(
  'I should see a confirmation page with the payment details',
  async ({ page, flow }) => {
    const dialog = page
      .locator('#acceptQuote')
      .locator('xpath=ancestor::div[1]')
    await expect(dialog).toBeVisible()

    const detailsText = await page
      .getByText('You send:', { exact: false })
      .innerText()

    // Parse "You send: €10.00 / Recipient gets: $10.xx / Fee: ..."
    const lines = detailsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const sendLine = lines.find((line) => line.startsWith('You send:'))
    // The recipient line is "<public name> gets: $x.xx" (falls back to
    // "Recipient gets:" when no public name is resolved).
    const receiveLine = lines.find((line) => line.includes('gets:'))

    if (!sendLine || !receiveLine) {
      throw new Error(`Unexpected quote details: "${detailsText}"`)
    }

    // Parse only the amount after the label — the receiver's public name (which
    // precedes "gets:") can itself contain digits.
    flow.expectedDebitAmount = parseAmountFromText(sendLine.split(':').pop()!)
    flow.expectedReceiveAmount = parseAmountFromText(
      receiveLine.slice(receiveLine.indexOf('gets:') + 'gets:'.length)
    )

    expect(flow.expectedDebitAmount).toBeCloseTo(10, 2)
    expect(flow.expectedReceiveAmount).toBeGreaterThan(0)

    await flow.takeScreenshot('send-confirmation-details')
  }
)

Then(
  'I should see a success message indicating the payment was sent',
  async ({ page, flow }) => {
    // Accept the quote to actually send the payment.
    await page.locator('#acceptQuote').click()

    await expect(page.getByText('Money was successfully sent.')).toBeVisible({
      timeout: 30_000
    })
    await flow.takeScreenshot('send-success-message')
  }
)

When(
  'I navigate to the transactions page of my EUR account',
  async ({ page, flow }) => {
    if (!flow.eurAccountId) {
      throw new Error('Missing EUR account id in flow state')
    }

    await page.goto(`/transactions?accountId=${flow.eurAccountId}`)
    await expect(page).toHaveURL(/\/transactions/)
    await expect(
      page.getByRole('heading', { name: 'Transactions' })
    ).toBeVisible()
    await flow.takeScreenshot('eur-transactions-page')
  }
)

Then(
  'I should see a new transaction with a debit of 10.00 EUR',
  async ({ page, flow }) => {
    const match = await findTransaction(
      page,
      (m) => m.direction === 'debit' && Math.abs(m.amount - 10) <= EPSILON
    )

    await flow.takeScreenshot('eur-debit-transaction')

    expect(
      match,
      'Expected an outgoing transaction of 10.00 EUR on the EUR account'
    ).not.toBeNull()
  }
)

When(
  'I navigate to the transactions page of my USD account',
  async ({ page, flow }) => {
    if (!flow.usdAccountId) {
      throw new Error('Missing USD account id in flow state')
    }

    await page.goto(`/transactions?accountId=${flow.usdAccountId}`)
    await expect(page).toHaveURL(/\/transactions/)
    await expect(
      page.getByRole('heading', { name: 'Transactions' })
    ).toBeVisible()
    await flow.takeScreenshot('usd-transactions-page')
  }
)

Then(
  'I should see a new transaction with a credit of the equivalent USD amount',
  async ({ page, flow }) => {
    const expected = flow.expectedReceiveAmount

    const match = await findTransaction(page, (m) => {
      if (m.direction !== 'credit') {
        return false
      }
      if (expected === undefined) {
        return m.amount > 0
      }
      return Math.abs(m.amount - expected) <= EPSILON
    })

    await flow.takeScreenshot('usd-credit-transaction')

    expect(
      match,
      `Expected an incoming USD credit${
        expected !== undefined ? ` of ~${expected.toFixed(2)}` : ''
      } on the USD account`
    ).not.toBeNull()
  }
)
