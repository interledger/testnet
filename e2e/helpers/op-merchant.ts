import { expect, type Page } from '@playwright/test'
import { Client } from 'pg'

type ScreenshotFn = (name: string) => Promise<void>

export type DeveloperKey = {
  keyId: string
  publicKey: string
  privateKey: string
}

function dbConnectionString(dbUrl?: string): string {
  return (
    dbUrl ||
    process.env.TEST_DB_URL ||
    'postgres://wallet_backend:wallet_backend@localhost:15434/wallet_backend'
  )
}

async function withDb<T>(
  fn: (client: Client) => Promise<T>,
  dbUrl?: string
): Promise<T> {
  const client = new Client({ connectionString: dbConnectionString(dbUrl) })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

/**
 * Read the canonical (https) wallet address URL of a user's account for a given
 * asset. A freshly provisioned user has a single default EUR account + wallet
 * address, so this returns that by default.
 */
export async function getWalletAddressUrl(
  email: string,
  options?: { assetCode?: string; dbUrl?: string }
): Promise<string> {
  const assetCode = options?.assetCode ?? 'EUR'
  const url = await withDb(async (client) => {
    const { rows } = await client.query<{ url: string }>(
      `SELECT wa.url
         FROM "walletAddresses" wa
         JOIN "accounts" a ON a.id = wa."accountId"
         JOIN "users" u ON u.id = a."userId"
        WHERE u.email = $1
          AND a."assetCode" = $2
          AND wa.active = true
        ORDER BY wa."createdAt" ASC
        LIMIT 1`,
      [email, assetCode]
    )
    return rows[0]?.url
  }, options?.dbUrl)

  if (!url) {
    throw new Error(
      `No active ${assetCode} wallet address found for user "${email}".`
    )
  }
  return url
}

/**
 * Read the keyId (JWKS `kid`) and public key of a developer key by nickname.
 * The private key is never persisted, so it must be captured at generation time
 * (see generateDeveloperKey).
 */
export async function getWalletAddressKey(
  email: string,
  nickname: string,
  options?: { dbUrl?: string }
): Promise<{ keyId: string; publicKey: string }> {
  const key = await withDb(async (client) => {
    const { rows } = await client.query<{ keyId: string; publicKey: string }>(
      `SELECT k.id AS "keyId", k."publicKey"
         FROM "walletAddressKeys" k
         JOIN "walletAddresses" wa ON wa.id = k."walletAddressId"
         JOIN "accounts" a ON a.id = wa."accountId"
         JOIN "users" u ON u.id = a."userId"
        WHERE u.email = $1
          AND k.nickname = $2
        ORDER BY k."createdAt" DESC
        LIMIT 1`,
      [email, nickname]
    )
    return rows[0]
  }, options?.dbUrl)

  if (!key) {
    throw new Error(`No developer key "${nickname}" found for user "${email}".`)
  }
  return key
}

/**
 * Drive Settings → Developer Keys → Generate to create a developer key on the
 * user's (default EUR) account. Returns the private key captured from the
 * success dialog; combine with getWalletAddressKey to obtain the keyId.
 *
 * The user must be logged in. Leaves the developer-keys page open.
 */
export async function generateDeveloperKey(args: {
  page: Page
  nickname: string
  accountName?: string
  takeScreenshot: ScreenshotFn
}): Promise<{ privateKey: string }> {
  const { page, nickname, takeScreenshot } = args
  const accountName = args.accountName ?? 'EUR Account'

  await page.goto('/settings/developer-keys')
  await expect(
    page.getByRole('heading', { name: 'Developer Keys' })
  ).toBeVisible()
  await takeScreenshot('dev-keys-page')

  // Expand the account disclosure to reveal its wallet addresses.
  await page.getByRole('button', { name: `Account: ${accountName}` }).click()

  const generateButton = page
    .locator('button[aria-label="generate keys"]')
    .first()
  await expect(generateButton).toBeVisible()
  await generateButton.click()
  await takeScreenshot('dev-keys-generate-dialog')

  await expect(
    page.getByRole('heading', { name: 'Generate public & private key' })
  ).toBeVisible()
  await page.locator('#nickname').fill(nickname)

  // The submit button reads "Generate keys" but carries aria-label="upload".
  await page.locator('button[aria-label="upload"]').click()

  // The success dialog shows the private key (PEM) inside #copyKey.
  const privateKeyLocator = page.locator('#copyKey code')
  await expect(privateKeyLocator).toBeVisible({ timeout: 30_000 })
  const privateKey = (await privateKeyLocator.innerText()).trim()
  await takeScreenshot('dev-keys-generated')

  if (!privateKey.includes('PRIVATE KEY')) {
    throw new Error(
      'Failed to capture a PEM private key from the success dialog.'
    )
  }

  await page.locator('#closeButtonSuccess').click()
  await expect(privateKeyLocator).toBeHidden()

  return { privateKey }
}

/**
 * Deposit funds into the user's (default EUR) account via the wallet UI.
 * Navigates to the account, opens the deposit dialog, funds it and waits for the
 * deposit webhook to settle.
 */
export async function depositIntoEurAccount(args: {
  page: Page
  amount: string
  takeScreenshot: ScreenshotFn
}): Promise<void> {
  const { page, amount, takeScreenshot } = args

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

  const eurAccount = page
    .locator('a[href*="/account/"]')
    .filter({ hasText: 'EUR Account' })
    .first()
  await expect(eurAccount).toBeVisible()
  await eurAccount.click()
  await expect(page).toHaveURL(/\/account\/.+/)

  await expect(page.locator('#fund')).toBeVisible()
  await page.locator('#fund').click()

  await expect(page.getByText('Deposit to Account')).toBeVisible()
  await page.getByLabel('Amount').fill(amount)
  await takeScreenshot('deposit-dialog-filled')

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
  await takeScreenshot('deposit-success')

  // Let the deposit webhook settle before the account is used for a payment.
  await page.waitForTimeout(4000)
}
