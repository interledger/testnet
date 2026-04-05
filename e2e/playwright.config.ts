import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const testBaseURL = process.env.TEST_BASE_URL || 'https://testnet.test'
const ignoreHTTPSErrors =
  process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === 'true' ||
  testBaseURL.startsWith('https://')

const testDir = defineBddConfig({
  paths: ['features/**/*.feature'],
  require: ['features/steps/**/*.ts']
})

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 15 * 1000
  },
  use: {
    baseURL: testBaseURL,
    ignoreHTTPSErrors,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1080 }
      }
    }
  ]
})
