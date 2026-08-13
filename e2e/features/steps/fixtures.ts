import { createBdd, test as base } from 'playwright-bdd'
import type { BrowserContext, Page } from '@playwright/test'
import {
  type Credentials,
  createUniqueCredentials
} from '../../helpers/local-wallet'
import type { MopcaHandle } from '../../mopca/server'
import { mkdir } from 'node:fs/promises'

type FlowState = {
  credentials: Credentials
  screenshotCounter: number
  accountPath?: string
  initialBalance?: number
  postDepositBalance?: number
  depositAmount?: number
  initialTransactionRows?: number
  postDepositTransactionRows?: number
  delayedRefreshTransactionRows?: number
  latestTransactionAmount?: number
  // Cross-currency transfer state
  eurAccountId?: string
  eurAccountPath?: string
  usdAccountId?: string
  usdAccountPath?: string
  usdWalletAddressUrl?: string
  expectedDebitAmount?: number
  expectedReceiveAmount?: number
  featureName: string
  takeScreenshot: (name: string) => Promise<void>
}

/**
 * State for the Open Payments purchase scenario, which involves two independent
 * users (merchant + customer) and an in-process MOPCA server. The customer uses
 * the default `page`; the merchant runs in its own browser context so both
 * sessions stay independent. Resources are torn down after the scenario.
 */
type OpPurchaseState = {
  merchant: {
    credentials?: Credentials
    walletAddressUrl?: string
    keyId?: string
    publicKey?: string
    privateKey?: string
    context?: BrowserContext
    page?: Page
  }
  customer: {
    credentials?: Credentials
    walletAddressUrl?: string
  }
  mopca?: MopcaHandle
}

export const test = base.extend<{
  flow: FlowState
  opPurchase: OpPurchaseState
}>({
  flow: async ({ page }, use, testInfo) => {
    // Extract feature name from the generated test file path
    // e.g., ".features-gen/auth-signup-dashboard.feature.spec.js" → "auth-signup-dashboard"
    const testFile = testInfo.file
    const fileName = testFile.split('/').pop() || 'unknown'
    const featureName = fileName
      .replace('.feature.spec.js', '')
      .replace('.feature.spec.ts', '')
      .replace('.spec.js', '')
      .replace('.spec.ts', '')

    const state: FlowState = {
      credentials: createUniqueCredentials(),
      screenshotCounter: 0,
      featureName,
      takeScreenshot: async (name: string) => {
        state.screenshotCounter += 1
        const screenshotDir = `test-results/${featureName}`
        await mkdir(screenshotDir, { recursive: true })
        await page.screenshot({
          path: `${screenshotDir}/${String(state.screenshotCounter).padStart(3, '0')}-${name}.png`,
          fullPage: true
        })
      }
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(state)
  },

  // eslint-disable-next-line no-empty-pattern
  opPurchase: async ({}, use) => {
    const state: OpPurchaseState = { merchant: {}, customer: {} }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(state)

    if (state.mopca) {
      await state.mopca.close().catch(() => {})
    }
    if (state.merchant.context) {
      await state.merchant.context.close().catch(() => {})
    }
  }
})

export const { Given, When, Then } = createBdd(test)
