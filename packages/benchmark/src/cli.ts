#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { WalletAddress } from '@interledger/open-payments'
import { loadConfig } from '@/config'
import { BenchmarkClient } from '@/open-payments'
import { obtainGrant } from '@/grant'
import {
  readGrantCache,
  writeGrantCache,
  upsertGrant,
  type GrantCacheData
} from '@/grant-cache'
import { runBenchmark, type GrantResolver } from '@/runner'
import { formatResult } from '@/report'
import { describeError } from '@/errors'
import { formatCsv } from '@/csv'
import { runProvision } from '@/provision'
import type {
  Amount,
  BenchmarkConfig,
  CachedGrant,
  PaymentSample,
  PaymentScenarioConfig
} from '@/types'

/**
 * Extra headroom added to a cross-currency grant's debit limit to absorb
 * per-slice FX rounding and mid-run rate drift. Same-currency runs need none
 * (the per-slice debit equals `paymentSize` exactly).
 */
const CROSS_CURRENCY_DEBIT_BUFFER_BPS = 200n // 2%

/**
 * Default ISO8601 period for the recurring outgoing-payment grant. The grant is
 * requested as `R/{start}/{period}`, so its `debitAmount` allowance resets every
 * period; a one-day period comfortably exceeds any single run (never capping a
 * run mid-flight) while letting the cached grant be reused day-to-day without
 * re-approval. Override via `grantInterval` in the config, or set it to an empty
 * string to request a single-use grant.
 */
const DEFAULT_GRANT_INTERVAL = 'P1D'

/**
 * Build the recurring interval string for a grant, or `undefined` for a
 * single-use grant when the period is explicitly blank.
 */
function grantIntervalFor(config: BenchmarkConfig): string | undefined {
  const period = config.grantInterval ?? DEFAULT_GRANT_INTERVAL
  if (period.trim() === '') {
    return undefined
  }
  return `R/${new Date().toISOString()}/${period}`
}

interface CliArgs {
  configPath: string
  grantsPath: string
}

function parseArgs(argv: string[]): CliArgs {
  const positional = argv.filter((a) => !a.startsWith('--'))
  const configPath = positional[0]
  if (!configPath) {
    throw new Error('Usage: op-benchmark <config.yaml> [--grants <cache.json>]')
  }
  const grantsFlag = argv.indexOf('--grants')
  const grantsPath =
    grantsFlag >= 0 && argv[grantsFlag + 1]
      ? argv[grantsFlag + 1]
      : resolve(dirname(configPath), 'grants.json')
  return { configPath, grantsPath }
}

/**
 * Probe the payer→receiver exchange by quoting a single slice against a
 * throwaway incoming payment, returning the debit (in the payer's asset)
 * required to deliver one `paymentSize` of the receiver's asset. For a
 * same-asset pair this is just `paymentSize`; across assets it reflects the FX
 * rate (and any per-slice fee).
 */
async function probeSliceDebit(
  client: BenchmarkClient,
  payer: WalletAddress,
  receiver: WalletAddress,
  scenario: PaymentScenarioConfig
): Promise<bigint> {
  if (scenario.amountScale !== receiver.assetScale) {
    throw new Error(
      `amountScale (${scenario.amountScale}) must match the receiver's asset scale (${receiver.assetScale}).`
    )
  }
  const sliceAmount = {
    value: String(scenario.paymentSize),
    assetCode: receiver.assetCode,
    assetScale: receiver.assetScale
  }
  const incomingToken = await client.nonInteractiveToken(
    receiver.authServer,
    'incoming-payment',
    ['create', 'read', 'list']
  )
  const probe = await client.createIncomingPayment({
    receiver,
    incomingAmount: sliceAmount,
    accessToken: incomingToken,
    description: 'benchmark grant-sizing probe'
  })
  const quoteToken = await client.nonInteractiveToken(payer.authServer, 'quote', [
    'create',
    'read'
  ])
  const quote = await client.createQuote({
    payer,
    receiver: probe.id,
    receiveAmount: sliceAmount,
    accessToken: quoteToken
  })
  return BigInt(quote.debitAmount.value)
}

/**
 * Resolve an approved grant for every unique payer up front (sequentially, so
 * interactive prompts are ordered), then hand the runner a pure lookup. Order
 * of preference: token pasted in the config → cached token → interactive
 * poll-based approval (which is then cached).
 *
 * The interactive grant's `debitAmount` limit is sized by probing the exchange
 * rate (see {@link probeSliceDebit}) and summing `perSliceDebit * slices` across
 * all of the payer's scenarios, so cross-currency runs request exactly the
 * payer-asset headroom they need rather than assuming debit == delivered.
 */
async function preResolveGrants(
  config: BenchmarkConfig,
  client: BenchmarkClient,
  grantsPath: string
): Promise<Map<string, CachedGrant>> {
  let cache: GrantCacheData = await readGrantCache(grantsPath)
  const resolved = new Map<string, CachedGrant>()
  const interval = grantIntervalFor(config)
  // Default to a limitless grant unless explicitly disabled.
  const limitless = config.limitlessGrant ?? true

  // Group scenarios by payer so one grant covers every scenario that payer runs.
  interface PayerGroup {
    payer: WalletAddress
    scenarios: PaymentScenarioConfig[]
    accessToken?: string
    manageUrl?: string
  }
  const groups = new Map<string, PayerGroup>()
  for (const scenario of config.payments) {
    const payer = await client.getWalletAddress(scenario.fromWalletAddress)
    const group = groups.get(payer.id) ?? { payer, scenarios: [] }
    group.scenarios.push(scenario)
    if (scenario.accessToken && !group.accessToken) {
      group.accessToken = scenario.accessToken
      group.manageUrl = scenario.manageUrl
    }
    groups.set(payer.id, group)
  }

  for (const [payerId, group] of groups) {
    if (group.accessToken) {
      resolved.set(payerId, {
        accessToken: group.accessToken,
        manageUrl: group.manageUrl
      })
      continue
    }

    const cached = cache[payerId]
    if (cached) {
      // A cached access token expires (10 min on Rafiki) and is dead between
      // sessions. Rotate it up front — the manage endpoint authenticates by the
      // client's signature, not the token's active state, so an expired token
      // still rotates into a fresh one with NO re-approval. Persist the result
      // so the cache never holds a stale token. Only if rotation truly fails
      // (grant revoked/finalized) do we drop the entry and re-request.
      if (cached.manageUrl) {
        try {
          const rotated = await client.rotateToken(
            cached.manageUrl,
            cached.accessToken
          )
          const fresh: CachedGrant = {
            accessToken: rotated.accessToken,
            manageUrl: rotated.manageUrl,
            continueUri: cached.continueUri
          }
          resolved.set(payerId, fresh)
          cache = upsertGrant(cache, payerId, fresh)
          await writeGrantCache(grantsPath, cache)
          console.log(`Using cached grant for ${payerId} (token refreshed).`)
          continue
        } catch {
          console.log(
            `Cached grant for ${payerId} could not be refreshed (likely revoked); requesting a new one.`
          )
          delete cache[payerId]
          await writeGrantCache(grantsPath, cache)
        }
      } else {
        // No manage URL to rotate with; use it as-is and hope it is still live.
        console.log(`Using cached grant for ${payerId}`)
        resolved.set(payerId, cached)
        continue
      }
    }

    // A limitless grant needs no probing: request it with no debit limit, so it
    // never exhausts across runs and Rafiki skips the per-grant row lock.
    let debitAmount: Amount | undefined
    if (limitless) {
      debitAmount = undefined
      console.log(
        `Requesting a limitless grant for ${payerId} (no debit limit; reusable across runs and no per-grant row lock).`
      )
    } else {
      // Size the debit limit by probing each scenario's exchange rate.
      let debit = 0n
      let crossCurrency = false
      for (const scenario of group.scenarios) {
        const receiver = await client.getWalletAddress(scenario.toWalletAddress)
        crossCurrency ||= group.payer.assetCode !== receiver.assetCode
        const perSlice = await probeSliceDebit(
          client,
          group.payer,
          receiver,
          scenario
        )
        debit += perSlice * BigInt(scenario.amount / scenario.paymentSize)
      }
      const limit = crossCurrency
        ? (debit * (10_000n + CROSS_CURRENCY_DEBIT_BUFFER_BPS)) / 10_000n + 1n
        : debit
      debitAmount = {
        value: limit.toString(),
        assetCode: group.payer.assetCode,
        assetScale: group.payer.assetScale
      }
      if (crossCurrency) {
        console.log(
          `Cross-currency payer ${payerId}: sizing grant debit limit to ${debitAmount.value} ${debitAmount.assetCode} (asset scale ${debitAmount.assetScale}, incl. ${CROSS_CURRENCY_DEBIT_BUFFER_BPS / 100n}% buffer).`
        )
      }
      console.log(
        interval
          ? `Requesting a recurring grant for ${payerId} (interval ${interval}); the ${debitAmount.value} ${debitAmount.assetCode} allowance resets each period, so the cached grant is reusable across runs.`
          : `Requesting a single-use grant for ${payerId}.`
      )
    }

    const grant = await obtainGrant({
      client,
      payer: group.payer,
      debitAmount,
      interval: limitless ? undefined : interval,
      prompt: (url) => {
        console.log(
          `\nApprove the outgoing-payment grant for ${payerId}:\n  ${url}\n(waiting for approval…)`
        )
      },
      log: (m) => console.log(m)
    })
    resolved.set(payerId, grant)
    cache = upsertGrant(cache, payerId, grant)
    await writeGrantCache(grantsPath, cache)
  }

  return resolved
}

async function main(): Promise<void> {
  const { configPath, grantsPath } = parseArgs(process.argv.slice(2))
  const config = loadConfig(configPath)
  const client = await BenchmarkClient.create(config.client)

  const grants = await preResolveGrants(config, client, grantsPath)
  const resolveGrant: GrantResolver = async (payer: WalletAddress) => {
    const grant = grants.get(payer.id)
    if (!grant) {
      throw new Error(`No grant resolved for payer ${payer.id}`)
    }
    return grant
  }

  const samples: PaymentSample[] = []
  const result = await runBenchmark(config, {
    client,
    resolveGrant,
    verbose: config.verbose,
    settleLatency: config.settleLatency,
    skipQuote: config.skipQuote,
    incomingExpiryMs: config.incomingExpiryMs,
    onSamples: (batch) => samples.push(...batch),
    log: (m) => console.log(m)
  })

  console.log(`\n${formatResult(result)}\n`)

  const outputPath =
    config.output ?? resolve(dirname(configPath), 'results.json')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  console.log(`Results written to ${outputPath}`)

  const csvPath = config.csvOutput ?? csvPathFor(outputPath)
  await mkdir(dirname(csvPath), { recursive: true })
  await writeFile(csvPath, formatCsv(result, samples), 'utf8')
  console.log(`Per-payment CSV (${samples.length} row(s)) written to ${csvPath}`)
}

/** Derive the CSV path from the JSON output path (swap `.json` → `.csv`). */
function csvPathFor(outputPath: string): string {
  return outputPath.endsWith('.json')
    ? `${outputPath.slice(0, -'.json'.length)}.csv`
    : `${outputPath}.csv`
}

// Subcommand dispatch. Default (no/other subcommand) runs the benchmark, so the
// existing `op-benchmark <config.yaml>` invocation is unchanged.
const [subcommand, ...rest] = process.argv.slice(2)
const entry =
  subcommand === 'provision' ? () => runProvision(rest) : () => main()

entry().catch((err) => {
  // `describeError` unpacks an OpenPaymentsClientError's status/code/description
  // (and, for a timeout, the failing method+URL) — the bare `.message` is just
  // the useless "Error making Open Payments <VERB> request".
  console.error(describeError(err))
  process.exitCode = 1
})
