#!/usr/bin/env node
/**
 * Seed the Rhyza local stack with the assets the Test Wallet needs.
 *
 * Unlike the v1 script there is no operator tenant to create — Rhyza is
 * single-tenant for now. Assets are unique by code alone; `scale` is a display
 * property, so re-running with a different scale will not create a second asset.
 *
 * Run after `pnpm local:up:rhyza`:
 *   node ./local/scripts/rhyza-setup.js
 */

const fs = require('fs')
const path = require('path')

const ASSETS = [
  { code: 'USD', scale: 2 },
  { code: 'EUR', scale: 2 }
  // { code: 'MXN', scale: 2 },
]

function log(message, details) {
  const line = `[${new Date().toISOString()}] ${message}`
  details === undefined ? console.log(line) : console.log(line, details)
}

function loadDotEnv(envPath) {
  const result = {}
  if (!fs.existsSync(envPath)) return result
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    result[line.slice(0, idx).trim()] = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  }
  return result
}

function buildEnv() {
  const fileEnv = {
    ...loadDotEnv(path.join(__dirname, '..', '.env.local')),
    ...loadDotEnv(path.join(__dirname, '..', '.env'))
  }
  const get = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback
  const int = (key, fallback) => {
    const n = Number.parseInt(get(key, String(fallback)), 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  return {
    // Published port from local/rhyza.yaml; the Traefik host works too but
    // needs the self-signed cert trusted, which this script does not assume.
    ADMIN_API_URL: get('RHYZA_ADMIN_API_URL', 'http://127.0.0.1:3021'),
    MAX_ATTEMPTS: int('RHYZA_SETUP_MAX_ATTEMPTS', 90),
    RETRY_INTERVAL_MS: int('RHYZA_SETUP_RETRY_INTERVAL_MS', 2000)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Resolves once the admin API answers at all — it exposes no health route. */
async function waitForAdminApi(env) {
  for (let attempt = 1; attempt <= env.MAX_ATTEMPTS; attempt++) {
    try {
      await fetch(`${env.ADMIN_API_URL}/assets`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      })
      log(`Admin API is up at ${env.ADMIN_API_URL}`)
      return
    } catch {
      if (attempt === 1 || attempt % 10 === 0) {
        log(`Waiting for admin API (${attempt}/${env.MAX_ATTEMPTS})…`)
      }
      if (attempt < env.MAX_ATTEMPTS) {
        await sleep(env.RETRY_INTERVAL_MS)
      }
    }
  }
  throw new Error(
    `Admin API did not become reachable at ${env.ADMIN_API_URL}. Is \`pnpm local:up:rhyza\` running?`
  )
}

async function createAsset(env, asset) {
  const response = await fetch(`${env.ADMIN_API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  })

  if (response.ok) {
    log(`Created asset ${asset.code} (scale ${asset.scale})`)
    return
  }

  const body = await response.text().catch(() => response.statusText)
  // Seeding is idempotent: any flavour of "already exists" is a success.
  if (response.status === 409 || /already exists|duplicate/i.test(body)) {
    log(`Asset ${asset.code} already exists, skipping`)
    return
  }

  throw new Error(
    `Failed to create asset ${asset.code}: ${response.status} ${body}`
  )
}

async function main() {
  const env = buildEnv()
  await waitForAdminApi(env)
  for (const asset of ASSETS) {
    await createAsset(env, asset)
  }
  log('Rhyza local setup complete')
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] ${error.message}`)
  process.exit(1)
})
