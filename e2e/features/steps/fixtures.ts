import { createBdd, test as base } from 'playwright-bdd'
import {
  type Credentials,
  createUniqueCredentials
} from '../../helpers/local-wallet'
import { mkdir } from 'node:fs/promises'

type FlowState = {
  credentials: Credentials
  logMarker: Date
  containerName: string
  screenshotCounter: number
  verificationLink?: string
  accountPath?: string
  initialBalance?: number
  postDepositBalance?: number
  depositAmount?: number
  initialTransactionRows?: number
  postDepositTransactionRows?: number
  delayedRefreshTransactionRows?: number
  latestTransactionAmount?: number
  featureName: string
  takeScreenshot: (name: string) => Promise<void>
}

export const test = base.extend<{ flow: FlowState }>({
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
      logMarker: new Date(),
      containerName:
        process.env.WALLET_BACKEND_CONTAINER || 'wallet-backend-local',
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
  }
})

export const { Given, When, Then } = createBdd(test)
