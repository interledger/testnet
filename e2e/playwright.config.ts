import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const testBaseURL = process.env.TEST_BASE_URL || 'https://testnet.test'
const ignoreHTTPSErrors = process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === 'true'

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
  // Open Payments scenarios provision multiple users and poll for ILP settlement,
  // so they need a longer ceiling than the simpler UI flows.
  timeout: 5 * 60 * 1000,
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
        viewport: { width: 1440, height: 1080 },
        // Resolve the in-process MOPCA host to loopback at the browser level, so
        // the Open Payments purchase test does not depend on an /etc/hosts entry
        // for mopca.testnet.test (the MOPCA server binds 127.0.0.1 directly).
        launchOptions: {
          args: ['--host-resolver-rules=MAP mopca.testnet.test 127.0.0.1']
        }
      }
    }
  ]
})
