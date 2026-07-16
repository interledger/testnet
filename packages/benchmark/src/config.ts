import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { load } from 'js-yaml'
import { z } from 'zod'
import type { BenchmarkConfig } from '@/types'

const clientSchema = z.object({
  walletAddressUrl: z.string().url(),
  keyId: z.string().min(1),
  privateKey: z.string().min(1)
})

const scenarioSchema = z
  .object({
    amount: z.number().int().positive(),
    amountScale: z.number().int().min(0).max(255),
    paymentSize: z.number().int().positive(),
    fromWalletAddress: z.string().url(),
    toWalletAddress: z.string().url(),
    workers: z.number().int().positive(),
    accessToken: z.string().min(1).optional(),
    manageUrl: z.string().url().optional()
  })
  .superRefine((scenario, ctx) => {
    if (scenario.amount % scenario.paymentSize !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `amount (${scenario.amount}) must be an exact multiple of paymentSize (${scenario.paymentSize})`,
        path: ['paymentSize']
      })
    }
    if (scenario.paymentSize > scenario.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'paymentSize cannot exceed the total amount',
        path: ['paymentSize']
      })
    }
    if (scenario.fromWalletAddress === scenario.toWalletAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fromWalletAddress and toWalletAddress must differ',
        path: ['toWalletAddress']
      })
    }
  })

const configSchema = z.object({
  client: clientSchema,
  output: z.string().min(1).optional(),
  csvOutput: z.string().min(1).optional(),
  sequential: z.boolean().optional(),
  verbose: z.boolean().optional(),
  settleLatency: z.boolean().optional(),
  skipQuote: z.boolean().optional(),
  limitlessGrant: z.boolean().optional(),
  grantInterval: z.string().optional(),
  incomingExpiryMs: z.number().int().positive().optional(),
  payments: z.array(scenarioSchema).min(1)
})

/** Validate an already-parsed config object, throwing a readable error. */
export function parseConfig(input: unknown): BenchmarkConfig {
  const result = configSchema.safeParse(input)
  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`
      )
      .join('\n')
    throw new Error(`Invalid benchmark config:\n${details}`)
  }
  return result.data
}

/**
 * Normalise the client's private key to raw PEM. Inline PEM (containing a
 * "PRIVATE KEY" header) is returned as-is; anything else is treated as a path
 * to a PEM file, resolved relative to `baseDir`.
 */
export function resolvePrivateKey(privateKey: string, baseDir: string): string {
  if (privateKey.includes('PRIVATE KEY')) {
    return privateKey
  }
  const keyPath = isAbsolute(privateKey)
    ? privateKey
    : resolve(baseDir, privateKey)
  const contents = readFileSync(keyPath, 'utf8')
  if (!contents.includes('PRIVATE KEY')) {
    throw new Error(
      `File "${keyPath}" does not look like a PEM private key (no "PRIVATE KEY" header).`
    )
  }
  return contents
}

/** Read, parse and validate a YAML config file at `path`. */
export function loadConfig(path: string): BenchmarkConfig {
  const raw = readFileSync(path, 'utf8')
  const parsed = load(raw)
  const config = parseConfig(parsed)
  const baseDir = isAbsolute(path)
    ? resolve(path, '..')
    : resolve(process.cwd(), path, '..')
  return {
    ...config,
    client: {
      ...config.client,
      privateKey: resolvePrivateKey(config.client.privateKey, baseDir)
    }
  }
}
