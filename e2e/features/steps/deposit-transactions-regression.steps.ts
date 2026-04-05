import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Given, Then, When } from './fixtures'

const EPSILON = 0.01

function parseAmountFromText(text: string): number {
  const normalized = text.replace(/,/g, '').replace(/[^0-9.-]/g, '')
  const parsed = Number.parseFloat(normalized)

  if (Number.isNaN(parsed)) {
    throw new Error(`Unable to parse amount from text: "${text}"`)
  }

  return parsed
}

async function readAccountBalance(page: Page) {
  const balanceSection = page
    .getByRole('heading', { name: 'Balance' })
    .locator('xpath=following-sibling::div[1]')

  const balanceText = await balanceSection.innerText()

  return parseAmountFromText(balanceText)
}

When('I open the EUR default account for deposit checks', async ({
  page,
  flow
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

  const defaultAccount = page
    .locator('a[href*="/account/"]')
    .filter({ hasText: 'EUR Account' })
    .first()

  await expect(defaultAccount).toBeVisible()
  await defaultAccount.click()

  await expect(page).toHaveURL(/\/account\/.+/)
  await expect(page.getByRole('heading', { name: 'Balance' })).toBeVisible()

  const url = new URL(page.url())
  flow.accountPath = `${url.pathname}${url.search}`

  await flow.takeScreenshot('deposit-check-account-opened')
})

When('I record the current account balance', async ({ page, flow }) => {
  flow.initialBalance = await readAccountBalance(page)
  await flow.takeScreenshot('deposit-check-initial-balance')
})

When('I record the current transactions count', async ({ page, flow }) => {
  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/transactions/)

  const rows = page.locator('#transactionsList tbody tr.cursor-pointer')
  flow.initialTransactionRows = await rows.count()

  await flow.takeScreenshot('deposit-check-initial-transactions')

  if (!flow.accountPath) {
    throw new Error('Missing account path in flow state')
  }

  await page.goto(flow.accountPath)
  await expect(page).toHaveURL(/\/account\/.+/)
})

When(
  'I complete a deposit of {float} EUR via the GateHub iframe',
  async ({ page, flow }, amount: number) => {
    flow.depositAmount = amount

    await page.goto('/deposit')
    await expect(page).toHaveURL(/\/deposit/, {
      message:
        'Expected /deposit page — ensure MockGatehub is running and GATEHUB_IFRAME_MANAGED_RAMP_URL is configured'
    })
    await expect(page.locator('iframe')).toBeVisible({
      message: 'Expected deposit iframe on /deposit page'
    })

    await expect(page.getByRole('heading', { name: 'Deposit' })).toBeVisible()
    await flow.takeScreenshot('deposit-iframe-page-opened')

    const frame = page.frameLocator('iframe')
    await expect(frame.locator('#amount')).toBeVisible()

    await frame.locator('#amount').fill(amount.toFixed(2))
    await frame.locator('#currency').selectOption('EUR')
    await flow.takeScreenshot('deposit-iframe-filled')

    await frame.getByTestId('complete-button').click()
    await expect(frame.locator('#status')).toContainText('successfully', {
      timeout: 30_000
    })
    await flow.takeScreenshot('deposit-iframe-submitted')

    // Give webhook + UI caches a chance to settle before measuring balance.
    await page.waitForTimeout(4000)

    if (!flow.accountPath) {
      throw new Error('Missing account path in flow state')
    }

    await page.goto(flow.accountPath)
    await expect(page).toHaveURL(/\/account\/.+/)

    flow.postDepositBalance = await readAccountBalance(page)
    await flow.takeScreenshot('deposit-iframe-post-balance')
  }
)

When(
  'I complete a deposit of {float} EUR via the local dialog',
  async ({ page, flow }, amount: number) => {
    flow.depositAmount = amount

    if (!flow.accountPath) {
      throw new Error('Missing account path in flow state')
    }

    await page.goto(flow.accountPath)
    await expect(page.locator('#fund')).toBeVisible()
    await page.locator('#fund').click()

    await expect(page.getByText('Deposit to your egg basket')).toBeVisible()

    await page.getByLabel('Amount').fill(amount.toFixed(2))
    await flow.takeScreenshot('deposit-dialog-filled')

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
    await flow.takeScreenshot('deposit-dialog-submitted')

    // Give webhook + UI caches a chance to settle before measuring balance.
    await page.waitForTimeout(4000)

    await page.goto(flow.accountPath)
    await expect(page).toHaveURL(/\/account\/.+/)

    flow.postDepositBalance = await readAccountBalance(page)
    await flow.takeScreenshot('deposit-dialog-post-balance')
  }
)

When('I open the transactions page for deposit checks', async ({ page, flow }) => {
  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/transactions/)
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()

  if (flow.initialTransactionRows === undefined) {
    throw new Error('Missing initial transactions count in flow state')
  }

  const expectedMinimumRows = flow.initialTransactionRows + 1
  let currentRows = 0

  for (let attempt = 0; attempt < 6; attempt++) {
    const rows = page.locator('#transactionsList tbody tr.cursor-pointer')
    currentRows = await rows.count()

    if (currentRows >= expectedMinimumRows) {
      break
    }

    await page.waitForTimeout(2000)
    await page.reload()
    await expect(page).toHaveURL(/\/transactions/)
  }

  flow.postDepositTransactionRows = currentRows

  expect(flow.postDepositTransactionRows).toBeGreaterThanOrEqual(
    expectedMinimumRows
  )

  const rows = page.locator('#transactionsList tbody tr.cursor-pointer')

  await expect(rows.first()).toBeVisible()

  const amountCellText = await rows
    .first()
    .locator('td')
    .nth(2)
    .innerText()

  flow.latestTransactionAmount = Math.abs(parseAmountFromText(amountCellText))

  await flow.takeScreenshot('deposit-check-post-transactions')
})

Then('the transaction count should increase by exactly 1', async ({ flow }) => {
  expect(flow.initialTransactionRows).toBeDefined()
  expect(flow.postDepositTransactionRows).toBeDefined()

  expect(flow.postDepositTransactionRows! - flow.initialTransactionRows!).toBe(1)
})

When('I wait {int} seconds and refresh transactions', async ({ page, flow }, seconds: number) => {
  await page.waitForTimeout(seconds * 1000)
  await page.reload()

  await expect(page).toHaveURL(/\/transactions/)
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()

  const rows = page.locator('#transactionsList tbody tr.cursor-pointer')
  flow.delayedRefreshTransactionRows = await rows.count()

  if (flow.delayedRefreshTransactionRows > 0) {
    await expect(rows.first()).toBeVisible()
  }
  await flow.takeScreenshot('deposit-check-post-transactions-delayed-refresh')
})

Then(
  'the transaction count should still increase by exactly 1',
  async ({ flow }) => {
    expect(flow.initialTransactionRows).toBeDefined()
    expect(flow.delayedRefreshTransactionRows).toBeDefined()

    expect(
      flow.delayedRefreshTransactionRows! - flow.initialTransactionRows!
    ).toBe(1)
  }
)

Then(
  'the latest transaction amount should match the deposit amount',
  async ({ flow }) => {
    expect(flow.depositAmount).toBeDefined()
    expect(flow.latestTransactionAmount).toBeDefined()

    const delta = Math.abs(flow.latestTransactionAmount! - flow.depositAmount!)
    expect(delta).toBeLessThanOrEqual(EPSILON)
  }
)

Then(
  'the account balance increase should match the deposit amount',
  async ({ flow }) => {
    expect(flow.initialBalance).toBeDefined()
    expect(flow.postDepositBalance).toBeDefined()
    expect(flow.depositAmount).toBeDefined()

    const increase = flow.postDepositBalance! - flow.initialBalance!
    expect(Math.abs(increase - flow.depositAmount!)).toBeLessThanOrEqual(EPSILON)
  }
)
