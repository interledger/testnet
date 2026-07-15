import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { CachedGrant } from '@/types'

/** On-disk cache of approved grants, keyed by payer wallet address URL. */
export type GrantCacheData = Record<string, CachedGrant>

/**
 * Read the grant cache. Returns an empty cache if the file does not exist or is
 * not valid JSON (the cache is a best-effort optimisation, never a source of
 * truth).
 */
export async function readGrantCache(path: string): Promise<GrantCacheData> {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }
    throw err
  }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as GrantCacheData
    }
    return {}
  } catch {
    return {}
  }
}

/** Persist the grant cache, creating parent directories as needed. */
export async function writeGrantCache(
  path: string,
  data: GrantCacheData
): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** Return a new cache with `grant` stored under `payerWalletAddress`. */
export function upsertGrant(
  data: GrantCacheData,
  payerWalletAddress: string,
  grant: CachedGrant
): GrantCacheData {
  return { ...data, [payerWalletAddress]: grant }
}
