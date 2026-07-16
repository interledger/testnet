/**
 * `op-benchmark provision` — bootstrap a local benchmark fleet.
 *
 * Drives the local TestNet wallet UI with Playwright to create a set of fully
 * initialised wallets (signup → email-verify → KYC → account → wallet address →
 * developer key), fund the senders, and write everything a later benchmark run
 * needs into an output folder (a `fleet.json` manifest + one PKCS8 key file per
 * wallet).
 *
 * The UI flows here mirror the e2e helpers in `../../../e2e/helpers/*` (the
 * source of truth). They are reimplemented rather than imported because the e2e
 * package is a test suite, not a buildable dependency of this package.
 *
 * Prerequisites: the local stack is up (`pnpm dev` + `pnpm local:rafiki-assets`
 * in the testnet repo), so `https://testnet.test`, the wallet backend on :3003,
 * and Postgres on :15434 are reachable, and the USD asset is seeded.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createHash, randomBytes } from 'node:crypto'
import { chromium, expect, type Browser, type Page } from '@playwright/test'
import { Client } from 'pg'

/** Word forms for sender labels (wallet-address slugs may not contain `0`). */
const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty'
]

export interface ProvisionOptions {
  /**
   * Prefix prepended to every wallet label/slug (e.g. `smoke-`). Wallet-address
   * slugs are global in Rafiki, so a prefix namespaces a fleet and avoids
   * colliding with an existing one. Empty by default (clean `receiver` /
   * `sender-one` … slugs). Must match `^[a-z1-9_-]*$` (no `0`).
   */
  prefix: string
  /** Number of sender wallets to create (labelled `sender-one`, …). */
  senders: number
  /** Asset code for every wallet (senders + receiver). */
  assetCode: string
  /** Amount (major units) deposited into each sender. */
  depositMajor: number
  /** Output folder for the manifest + key files. */
  outDir: string
  /** Wallet frontend base URL. */
  baseUrl: string
  /** Wallet backend Postgres connection string (for the email-verify bypass and reads). */
  dbUrl: string
  /** Wallet backend base URL (direct HTTP, bypassing the self-signed proxy cert). */
  apiUrl: string
  /** Open Payments host that forms wallet-address URLs (for logging only). */
  openPaymentsHost: string
  /** Nickname to give each generated developer key. */
  keyNickname: string
  /** Run the browser headed (for debugging). */
  headed: boolean
}

const DEFAULTS: ProvisionOptions = {
  prefix: '',
  senders: 10,
  assetCode: 'USD',
  depositMajor: 100000,
  outDir: './runs/local-fleet',
  baseUrl: process.env.TEST_BASE_URL || 'https://testnet.test',
  dbUrl:
    process.env.TEST_DB_URL ||
    'postgres://wallet_backend:wallet_backend@localhost:15434/wallet_backend',
  apiUrl: process.env.TEST_API_URL || 'http://localhost:3003',
  openPaymentsHost:
    process.env.OPEN_PAYMENTS_HOST || 'https://rafiki-backend.testnet.test',
  keyNickname: 'benchmark',
  headed: false
}

/** A single provisioned wallet, as persisted to the fleet manifest. */
export interface ProvisionedWallet {
  label: string
  role: 'sender' | 'receiver'
  /** Index (0-based) of the sender/receiver pair this wallet belongs to. */
  pairIndex: number
  assetCode: string
  walletAddressUrl: string
  accountId: string
  keyId: string
  /** PKCS8 PEM key file, relative to the manifest's folder. */
  privateKeyFile: string
  email: string
  password: string
  /** Amount deposited (major units); senders only (receivers are not funded). */
  depositedMajor?: string
}

/**
 * A sender and the dedicated receiver it pays. Each sender fills its own
 * receiver's incoming payment, so the credit side never serializes on a single
 * account — the point of provisioning one receiver per sender.
 */
export interface FleetPair {
  sender: ProvisionedWallet | null
  receiver: ProvisionedWallet | null
}

export interface Fleet {
  createdAt: string
  baseUrl: string
  openPaymentsHost: string
  assetCode: string
  pairs: FleetPair[]
}

interface Credentials {
  email: string
  password: string
}

// ---- DB helpers (mirror e2e/helpers) --------------------------------------

async function withDb<T>(
  dbUrl: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

/**
 * Verify a user's email without SMTP: inject a known token hash into the DB,
 * then call the real `/verify-email/:token` endpoint (which also provisions the
 * GateHub managed user needed for KYC).
 */
async function verifyUserDirectly(
  opts: ProvisionOptions,
  email: string
): Promise<void> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  await withDb(opts.dbUrl, (client) =>
    client.query('UPDATE users SET "verifyEmailToken" = $1 WHERE email = $2', [
      tokenHash,
      email
    ])
  )

  const response = await fetch(`${opts.apiUrl}/verify-email/${token}`, {
    method: 'POST',
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Email verification failed (${response.status}): ${body}`)
  }
}

async function readWalletAddressUrl(
  opts: ProvisionOptions,
  email: string,
  assetCode: string
): Promise<string> {
  const url = await withDb(opts.dbUrl, async (client) => {
    const { rows } = await client.query<{ url: string }>(
      `SELECT wa.url
         FROM "walletAddresses" wa
         JOIN "accounts" a ON a.id = wa."accountId"
         JOIN "users" u ON u.id = a."userId"
        WHERE u.email = $1 AND a."assetCode" = $2 AND wa.active = true
        ORDER BY wa."createdAt" DESC
        LIMIT 1`,
      [email, assetCode]
    )
    return rows[0]?.url
  })
  if (!url) {
    throw new Error(`No active ${assetCode} wallet address for "${email}".`)
  }
  return url
}

async function readKeyId(
  opts: ProvisionOptions,
  email: string,
  nickname: string
): Promise<string> {
  const keyId = await withDb(opts.dbUrl, async (client) => {
    const { rows } = await client.query<{ keyId: string }>(
      `SELECT k.id AS "keyId"
         FROM "walletAddressKeys" k
         JOIN "walletAddresses" wa ON wa.id = k."walletAddressId"
         JOIN "accounts" a ON a.id = wa."accountId"
         JOIN "users" u ON u.id = a."userId"
        WHERE u.email = $1 AND k.nickname = $2
        ORDER BY k."createdAt" DESC
        LIMIT 1`,
      [email, nickname]
    )
    return rows[0]?.keyId
  })
  if (!keyId) {
    throw new Error(`No developer key "${nickname}" for "${email}".`)
  }
  return keyId
}

// ---- UI flows (mirror e2e/helpers) ----------------------------------------

function uniqueCredentials(label: string): Credentials {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return {
    email: `bench-${label}-${suffix}@ilp.com`,
    password: `Testnet!${suffix}Aa`
  }
}

/** Signup → email-verify (DB bypass) → login → KYC → dashboard. */
async function setupVerifiedUser(
  opts: ProvisionOptions,
  page: Page,
  label: string
): Promise<Credentials> {
  const credentials = uniqueCredentials(label)

  await page.goto('/auth/signup')
  const signup = page.locator('form')
  await signup.getByLabel('E-mail *', { exact: true }).fill(credentials.email)
  await signup
    .getByLabel('Password *', { exact: true })
    .fill(credentials.password)
  await signup
    .getByLabel('Confirm password *', { exact: true })
    .fill(credentials.password)
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith('/signup') &&
        r.request().method() === 'POST' &&
        r.status() === 201
    ),
    signup.locator('button[type="submit"]').click()
  ])
  await expect(
    page.getByText('A verification link has been sent to your email account.')
  ).toBeVisible()

  await verifyUserDirectly(opts, credentials.email)

  await page.goto('/auth/login')
  const login = page.locator('form')
  await login.getByLabel('E-mail *', { exact: true }).fill(credentials.email)
  await login.getByLabel('Password *', { exact: true }).fill(credentials.password)
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith('/login') &&
        r.request().method() === 'POST' &&
        r.status() === 200
    ),
    login.locator('button[type="submit"]').click()
  ])
  await page.waitForURL(/\/(kyc)?$/, { timeout: 60_000 })

  if (page.url().endsWith('/kyc')) {
    const frame = page.frameLocator('iframe')
    await frame.getByLabel('First Name').fill('Bench')
    await frame.getByLabel('Last Name').fill(label)
    await frame.getByLabel('Date of Birth').fill('1990-01-01')
    await frame.getByLabel('Address').fill('1 Test Lane')
    await frame.getByLabel('City').fill('Basel')
    await frame.getByLabel('Country').fill('Switzerland')
    await Promise.all([
      page.waitForURL(/\/$/, { timeout: 60_000 }),
      frame.locator('#submitBtn').click()
    ])
  }

  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  return credentials
}

/** Create an account for `assetCode` and a wallet address `slug` under it. */
async function createAccountWithWalletAddress(
  page: Page,
  args: {
    accountName: string
    assetCode: string
    slug: string
    publicName: string
  }
): Promise<{ accountId: string }> {
  await page.goto('/account/create')
  await expect(
    page.getByRole('heading', { name: 'Create a new account' })
  ).toBeVisible()

  await page.getByLabel('Account name').fill(args.accountName)
  const assetField = page
    .locator('#createAccountForm div.space-y-1')
    .filter({ has: page.locator('label', { hasText: 'Asset' }) })
  await assetField.click()
  await page.getByRole('option', { name: args.assetCode, exact: true }).click()

  await page.getByRole('button', { name: 'create account' }).click()
  await expect(page.getByText('Account created.')).toBeVisible()
  await page.locator('#redirectButtonSuccess').click()
  // Wait for the redirect to the created account page. `/account/.+` also matches
  // the `/account/create` page we're leaving, so require a real (non-`create`) id.
  await page.waitForURL(
    (url) =>
      /\/account\//.test(url.pathname) && !url.pathname.endsWith('/create'),
    { timeout: 30_000 }
  )
  const accountId = new URL(page.url()).pathname.split('/account/')[1]

  await page.locator('#walletAddress').click()
  await expect(
    page.getByRole('heading', { name: 'Create Wallet Address' })
  ).toBeVisible()
  await page.getByLabel('Wallet Address name').fill(args.slug)
  await page.getByLabel('Public name').fill(args.publicName)
  await page.getByRole('button', { name: 'create payment pointer' }).click()
  await expect(
    page.getByRole('heading', { name: 'Create Wallet Address' })
  ).toBeHidden()

  return { accountId }
}

/** Generate a developer key on an account and capture the PEM private key. */
async function generateDeveloperKey(
  page: Page,
  args: { accountName: string; nickname: string }
): Promise<{ privateKey: string }> {
  await page.goto('/settings/developer-keys')
  await expect(
    page.getByRole('heading', { name: 'Developer Keys' })
  ).toBeVisible()

  await page
    .getByRole('button', { name: `Account: ${args.accountName}` })
    .click()
  const generate = page.locator('button[aria-label="generate keys"]').first()
  await expect(generate).toBeVisible()
  await generate.click()

  await expect(
    page.getByRole('heading', { name: 'Generate public & private key' })
  ).toBeVisible()
  await page.locator('#nickname').fill(args.nickname)
  await page.locator('button[aria-label="upload"]').click()

  const privateKeyLocator = page.locator('#copyKey code')
  await expect(privateKeyLocator).toBeVisible({ timeout: 30_000 })
  const privateKey = (await privateKeyLocator.innerText()).trim()
  await page.locator('#closeButtonSuccess').click()

  if (!privateKey.includes('PRIVATE KEY')) {
    throw new Error('Failed to capture a PEM private key from the dialog.')
  }
  return { privateKey }
}

/** Deposit `amount` (major units) into the named account via the fund dialog. */
async function depositIntoAccount(
  page: Page,
  args: { accountName: string; amount: string }
): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

  const account = page
    .locator('a[href*="/account/"]')
    .filter({ hasText: args.accountName })
    .first()
  await expect(account).toBeVisible()
  await account.click()
  await expect(page).toHaveURL(/\/account\/.+/)

  await expect(page.locator('#fund')).toBeVisible()
  await page.locator('#fund').click()
  await expect(page.getByText('Deposit to Account')).toBeVisible()
  await page.getByLabel('Amount').fill(args.amount)

  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes('/fund') &&
        r.request().method() === 'POST' &&
        r.status() >= 200 &&
        r.status() < 300
    ),
    page.locator('button[aria-label="deposit"]').click()
  ])
  await expect(page.getByText('Deposit success')).toBeVisible()
  // Let the deposit webhook settle before the account is used.
  await page.waitForTimeout(4000)
}

// ---- orchestration ---------------------------------------------------------

/** Provision one wallet end-to-end in its own isolated browser context. */
async function provisionWallet(
  browser: Browser,
  opts: ProvisionOptions,
  spec: WalletSpec
): Promise<{ wallet: ProvisionedWallet; privateKey: string }> {
  const accountName = `${opts.assetCode} Account`
  const context = await browser.newContext({
    baseURL: opts.baseUrl,
    ignoreHTTPSErrors: true
  })
  const page = await context.newPage()
  try {
    const { email, password } = await setupVerifiedUser(opts, page, spec.label)
    const { accountId } = await createAccountWithWalletAddress(page, {
      accountName,
      assetCode: opts.assetCode,
      slug: spec.label,
      publicName: spec.label
    })
    const { privateKey } = await generateDeveloperKey(page, {
      accountName,
      nickname: opts.keyNickname
    })

    let depositedMajor: string | undefined
    if (spec.role === 'sender') {
      await depositIntoAccount(page, {
        accountName,
        amount: String(opts.depositMajor)
      })
      depositedMajor = String(opts.depositMajor)
    }

    const walletAddressUrl = await readWalletAddressUrl(
      opts,
      email,
      opts.assetCode
    )
    const keyId = await readKeyId(opts, email, opts.keyNickname)

    return {
      privateKey,
      wallet: {
        label: spec.label,
        role: spec.role,
        pairIndex: spec.pairIndex,
        assetCode: opts.assetCode,
        walletAddressUrl,
        accountId,
        keyId,
        privateKeyFile: `keys/${spec.label}.key`,
        email,
        password,
        depositedMajor
      }
    }
  } finally {
    await context.close()
  }
}

interface WalletSpec {
  label: string
  role: 'sender' | 'receiver'
  pairIndex: number
}

/**
 * The full set of wallets to provision: one sender + one dedicated receiver per
 * pair, interleaved (`sender-one`, `receiver-one`, `sender-two`, …) so each pair
 * completes together and the manifest is consistent after every wallet.
 */
function fleetSpecs(opts: ProvisionOptions): WalletSpec[] {
  if (opts.senders > NUMBER_WORDS.length) {
    throw new Error(
      `--senders must be ≤ ${NUMBER_WORDS.length} (labels are spelled out to avoid the digit 0, which wallet-address slugs forbid).`
    )
  }
  const specs: WalletSpec[] = []
  for (let i = 0; i < opts.senders; i++) {
    const word = NUMBER_WORDS[i]
    specs.push({ label: `${opts.prefix}sender-${word}`, role: 'sender', pairIndex: i })
    specs.push({
      label: `${opts.prefix}receiver-${word}`,
      role: 'receiver',
      pairIndex: i
    })
  }
  return specs
}

/** Group the flat list of provisioned wallets into sender/receiver pairs. */
function buildFleet(
  opts: ProvisionOptions,
  createdAt: string,
  wallets: ProvisionedWallet[]
): Fleet {
  const maxPair = wallets.reduce((m, w) => Math.max(m, w.pairIndex), -1)
  const pairs: FleetPair[] = []
  for (let i = 0; i <= maxPair; i++) {
    const sender = wallets.find((w) => w.pairIndex === i && w.role === 'sender')
    const receiver = wallets.find(
      (w) => w.pairIndex === i && w.role === 'receiver'
    )
    if (sender || receiver) {
      pairs.push({ sender: sender ?? null, receiver: receiver ?? null })
    }
  }
  return {
    createdAt,
    baseUrl: opts.baseUrl,
    openPaymentsHost: opts.openPaymentsHost,
    assetCode: opts.assetCode,
    pairs
  }
}

/** Canonical Open Payments wallet-address URL for a label. */
function walletUrl(opts: ProvisionOptions, label: string): string {
  return `${opts.openPaymentsHost.replace(/\/+$/, '')}/${label}`
}

/** True if an active wallet address with this URL already exists in Rafiki. */
async function walletAddressExists(
  opts: ProvisionOptions,
  url: string
): Promise<boolean> {
  return withDb(opts.dbUrl, async (client) => {
    const { rowCount } = await client.query(
      'SELECT 1 FROM "walletAddresses" WHERE url = $1 AND active = true LIMIT 1',
      [url]
    )
    return (rowCount ?? 0) > 0
  })
}

/** Read a prior fleet manifest (for idempotent re-runs), or null if absent/invalid. */
async function readExistingFleet(manifestPath: string): Promise<Fleet | null> {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, 'utf8'))
    return parsed && Array.isArray(parsed.pairs) ? (parsed as Fleet) : null
  } catch {
    return null
  }
}

function parseProvisionArgs(argv: string[]): ProvisionOptions {
  const opts: ProvisionOptions = { ...DEFAULTS }
  const value = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const num = (flag: string, current: number): number => {
    const raw = value(flag)
    if (raw === undefined) return current
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`${flag} must be a positive number, got "${raw}"`)
    }
    return n
  }
  opts.prefix = value('--prefix') ?? opts.prefix
  opts.senders = num('--senders', opts.senders)
  opts.depositMajor = num('--deposit', opts.depositMajor)
  opts.outDir = value('--out') ?? opts.outDir
  opts.assetCode = value('--asset') ?? opts.assetCode
  opts.baseUrl = value('--base-url') ?? opts.baseUrl
  opts.dbUrl = value('--db-url') ?? opts.dbUrl
  opts.apiUrl = value('--api-url') ?? opts.apiUrl
  opts.openPaymentsHost = value('--op-host') ?? opts.openPaymentsHost
  opts.keyNickname = value('--nickname') ?? opts.keyNickname
  opts.headed = argv.includes('--headed')
  return opts
}

/**
 * Provision the fleet and write `<outDir>/fleet.json` + `<outDir>/keys/*.key`.
 * Wallets are provisioned sequentially (the wallet app is not built for
 * concurrent signups) and the manifest is rewritten after each one, so partial
 * progress survives a mid-run failure.
 */
export async function runProvision(argv: string[]): Promise<void> {
  const opts = parseProvisionArgs(argv)
  const specs = fleetSpecs(opts)
  const createdAt = new Date().toISOString()
  const keysDir = join(opts.outDir, 'keys')
  const manifestPath = join(opts.outDir, 'fleet.json')
  await mkdir(keysDir, { recursive: true })

  // Idempotency: index any wallets already recorded in a prior manifest so a
  // re-run reuses them (when the key file is still present and the wallet
  // address still exists) instead of re-provisioning.
  const priorByLabel = new Map<string, ProvisionedWallet>()
  const prior = await readExistingFleet(manifestPath)
  for (const pair of prior?.pairs ?? []) {
    if (pair.sender) priorByLabel.set(pair.sender.label, pair.sender)
    if (pair.receiver) priorByLabel.set(pair.receiver.label, pair.receiver)
  }

  console.log(
    `Provisioning ${opts.senders} sender/receiver pair(s) in ${opts.assetCode} ` +
      `against ${opts.baseUrl} (deposit ${opts.depositMajor} ${opts.assetCode}/sender; receivers unfunded).`
  )
  console.log(`Output folder: ${opts.outDir}`)

  const done: ProvisionedWallet[] = []
  let reused = 0
  const skipped: Array<{ label: string; reason: string }> = []
  const failures: Array<{ label: string; error: string }> = []

  const writeManifest = () =>
    writeFile(
      manifestPath,
      `${JSON.stringify(buildFleet(opts, createdAt, done), null, 2)}\n`,
      'utf8'
    )

  const browser = await chromium.launch({ headless: !opts.headed })
  try {
    for (const [idx, spec] of specs.entries()) {
      const n = `${idx + 1}/${specs.length}`
      const url = walletUrl(opts, spec.label)

      // 1. Reuse a wallet from a prior run (manifest entry + key file + still exists).
      const priorWallet = priorByLabel.get(spec.label)
      if (
        priorWallet &&
        existsSync(join(opts.outDir, priorWallet.privateKeyFile)) &&
        (await walletAddressExists(opts, priorWallet.walletAddressUrl))
      ) {
        done.push({ ...priorWallet, role: spec.role, pairIndex: spec.pairIndex })
        reused += 1
        await writeManifest()
        console.log(`[${n}] ↺ ${spec.label} already provisioned — reusing.`)
        continue
      }

      // 2. Slug is taken (a prior/partial run) but not reusable: a wallet
      //    address's private key is shown only once at creation, so we can't
      //    reconstruct a usable entry for it.
      if (await walletAddressExists(opts, url)) {
        const reason =
          'wallet address already exists but its key is not in this manifest — ' +
          'reset the local env or use --prefix to namespace a fresh fleet'
        skipped.push({ label: spec.label, reason })
        console.warn(`[${n}] ⚠ ${spec.label} skipped: ${reason}`)
        continue
      }

      // 3. Provision fresh.
      console.log(`[${n}] provisioning ${spec.label} (${spec.role})…`)
      try {
        const { wallet, privateKey } = await provisionWallet(browser, opts, spec)
        await writeFile(
          join(opts.outDir, wallet.privateKeyFile),
          `${privateKey}\n`,
          { mode: 0o600 }
        )
        done.push(wallet)
        await writeManifest()
        console.log(
          `[${n}] ✓ ${spec.label} → ${wallet.walletAddressUrl}` +
            (wallet.depositedMajor
              ? ` (deposited ${wallet.depositedMajor} ${opts.assetCode})`
              : '')
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        failures.push({ label: spec.label, error: message })
        console.error(`[${n}] ✗ ${spec.label} FAILED: ${message}`)
      }
    }
  } finally {
    await browser.close()
  }

  const fresh = done.length - reused
  console.log(
    `\nFleet: ${done.length}/${specs.length} wallet(s) ready (${fresh} new, ${reused} reused). ` +
      `Manifest: ${relative(process.cwd(), manifestPath)}`
  )
  if (skipped.length) {
    console.warn(
      `\n${skipped.length} wallet(s) skipped:\n` +
        skipped.map((s) => `  - ${s.label}: ${s.reason}`).join('\n')
    )
  }
  if (failures.length) {
    console.error(
      `\n${failures.length} wallet(s) failed:\n` +
        failures.map((f) => `  - ${f.label}: ${f.error}`).join('\n')
    )
  }
  if (skipped.length || failures.length) {
    process.exitCode = 1
  }
}
