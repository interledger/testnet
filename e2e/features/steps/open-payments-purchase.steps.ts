import { expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { setupVerifiedUser } from '../../helpers/local-wallet'
import {
  depositIntoEurAccount,
  generateDeveloperKey,
  getWalletAddressKey,
  getWalletAddressUrl
} from '../../helpers/op-merchant'
import { startMopca } from '../../mopca/server'
import { Given, Then, When } from './fixtures'

const MERCHANT_KEY_NICKNAME = 'e2e'
const PURCHASE_AMOUNT = 9.99
const EPSILON = 0.01
const BASE_URL = process.env.TEST_BASE_URL || 'https://testnet.test'

/** A screenshot helper bound to a specific page (used for the merchant context). */
function screenshotter(
  page: Page,
  featureName: string,
  prefix: string
): (name: string) => Promise<void> {
  let counter = 0
  return async (name: string) => {
    counter += 1
    const dir = `test-results/${featureName}`
    await mkdir(dir, { recursive: true })
    await page.screenshot({
      path: `${dir}/${prefix}-${String(counter).padStart(3, '0')}-${name}.png`,
      fullPage: true
    })
  }
}

function parseAmount(text: string): number {
  const parsed = Number.parseFloat(
    text.replace(/,/g, '').replace(/[^0-9.]/g, '')
  )
  if (Number.isNaN(parsed)) {
    throw new Error(`Unable to parse amount from text: "${text}"`)
  }
  return parsed
}

/**
 * Poll a per-account transactions page (reloading between attempts) until an
 * incoming (credit) row matching the amount appears. Open Payments settles via
 * ILP webhooks, so the transaction may lag the payment completion.
 */
async function findIncomingTransaction(
  page: Page,
  amount: number
): Promise<boolean> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(3000)
      await page.reload()
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
      const isCredit = !amountText.startsWith('-')
      if (isCredit && Math.abs(parseAmount(amountText) - amount) <= EPSILON) {
        return true
      }
    }
  }
  return false
}

Given(
  'an EUR merchant user with developer keys configured',
  async ({ browser, opPurchase, flow }) => {
    // The merchant runs in its own browser context so its session stays
    // independent from the customer (who uses the default page).
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      baseURL: BASE_URL
    })
    const page = await context.newPage()
    opPurchase.merchant.context = context
    opPurchase.merchant.page = page

    const shot = screenshotter(page, flow.featureName, 'merchant')

    const credentials = await setupVerifiedUser({
      page,
      takeScreenshot: shot,
      skipScreenshots: true
    })
    opPurchase.merchant.credentials = credentials

    // Generate developer keys via the UI (nickname "e2e"); capture the private
    // key from the dialog and read keyId/publicKey from the database.
    const { privateKey } = await generateDeveloperKey({
      page,
      nickname: MERCHANT_KEY_NICKNAME,
      takeScreenshot: shot
    })
    const { keyId, publicKey } = await getWalletAddressKey(
      credentials.email,
      MERCHANT_KEY_NICKNAME
    )

    opPurchase.merchant.privateKey = privateKey
    opPurchase.merchant.keyId = keyId
    opPurchase.merchant.publicKey = publicKey
    opPurchase.merchant.walletAddressUrl = await getWalletAddressUrl(
      credentials.email
    )
  }
)

Given(
  'an EUR customer user with 100 EUR deposited into their account',
  async ({ page, opPurchase, flow }) => {
    const credentials = await setupVerifiedUser({
      page,
      takeScreenshot: flow.takeScreenshot,
      skipScreenshots: true
    })
    opPurchase.customer.credentials = credentials

    await depositIntoEurAccount({
      page,
      amount: '100.00',
      takeScreenshot: flow.takeScreenshot
    })

    opPurchase.customer.walletAddressUrl = await getWalletAddressUrl(
      credentials.email
    )
  }
)

Given(
  'a running Mock Open Payments Client App initiated with the merchant keys',
  async ({ opPurchase }) => {
    const { merchant, customer } = opPurchase
    if (
      !merchant.walletAddressUrl ||
      !merchant.keyId ||
      !merchant.privateKey ||
      !customer.walletAddressUrl
    ) {
      throw new Error('Merchant/customer setup did not complete.')
    }

    // startMopca verifies it can reach the ASE with the merchant credentials.
    opPurchase.mopca = await startMopca({
      merchant: {
        walletAddressUrl: merchant.walletAddressUrl,
        keyId: merchant.keyId,
        privateKey: merchant.privateKey
      },
      customerWalletAddressUrl: customer.walletAddressUrl,
      item: { amount: PURCHASE_AMOUNT, description: 'testing stuff' }
    })
  }
)

When(
  'the customer initiates a payment of 9.99 EUR through the MOPCA',
  async ({ page, opPurchase, flow }) => {
    if (!opPurchase.mopca) {
      throw new Error('MOPCA is not running.')
    }

    await page.goto(opPurchase.mopca.url)
    await expect(page.locator('#buyStuff')).toBeVisible()
    await expect(page.locator('#itemPrice')).toHaveText('9.99 EUR')
    await flow.takeScreenshot('mopca-storefront')

    // Submitting the purchase redirects the customer to the ASE consent screen.
    await Promise.all([
      page.waitForURL(/\/grant-interactions/, { timeout: 60_000 }),
      page.locator('#buyStuff').click()
    ])
    await flow.takeScreenshot('grant-interaction-page')
  }
)

Then(
  'the customer should be asked to verify the payment',
  async ({ page, flow }) => {
    await expect(page.locator('button[aria-label="accept"]')).toBeVisible({
      timeout: 30_000
    })
    await expect(page.getByText('requesting access to')).toBeVisible()
    await flow.takeScreenshot('grant-interaction-prompt')
  }
)

Then(
  'the customer should be informed about the success of the payment',
  async ({ page, opPurchase, flow }) => {
    // Approve the grant; the ASE redirects back to the MOPCA finish endpoint,
    // which continues the grant, creates the outgoing payment and confirms the
    // incoming payment was received.
    await Promise.all([
      page.waitForURL(/mopca\.testnet\.test.*\/finish/, { timeout: 90_000 }),
      page.locator('button[aria-label="accept"]').click()
    ])

    const result = page.locator('#paymentResult')
    await expect(result).toBeVisible({ timeout: 90_000 })
    await flow.takeScreenshot('mopca-payment-result')
    await expect(result).toHaveAttribute('data-status', 'completed')

    expect(opPurchase.mopca?.getResult()?.status).toBe('completed')
  }
)

When(
  'the merchant logs into their account and views transactions',
  async ({ opPurchase, flow }) => {
    const page = opPurchase.merchant.page
    if (!page) {
      throw new Error('Merchant page is not available.')
    }
    const shot = screenshotter(page, flow.featureName, 'merchant')

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

    const eurAccount = page
      .locator('a[href*="/account/"]')
      .filter({ hasText: 'EUR Account' })
      .first()
    await expect(eurAccount).toBeVisible()
    await eurAccount.click()
    await expect(page).toHaveURL(/\/account\/.+/)

    const accountId = new URL(page.url()).pathname.split('/account/')[1]
    await page.goto(`/transactions?accountId=${accountId}`)
    await expect(
      page.getByRole('heading', { name: 'Transactions' })
    ).toBeVisible()
    await shot('merchant-transactions-page')
  }
)

Then(
  'a recent incoming transaction of 9.99 EUR should be visible',
  async ({ opPurchase, flow }) => {
    const page = opPurchase.merchant.page
    if (!page) {
      throw new Error('Merchant page is not available.')
    }
    const shot = screenshotter(page, flow.featureName, 'merchant')

    const found = await findIncomingTransaction(page, PURCHASE_AMOUNT)
    await shot('merchant-incoming-transaction')

    expect(
      found,
      'Expected an incoming 9.99 EUR transaction on the merchant EUR account'
    ).toBe(true)
  }
)
