#!/usr/bin/env node
/**
 * Configure Rafiki (local docker stack) with a tenant + assets.
 * - Reads values from .env in this directory (local/scripts/.env) when present (process.env takes priority)
 * - Creates the operator tenant (idpConsentUrl + idpSecret)
 * - Ensures assets exist for the Testnet wallet
 *
 * Run after `docker compose up -d` from local/:
 *   node scripts/rafiki-setup.js
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// ---- helpers ---------------------------------------------------------------
function loadDotEnv(envPath) {
  const result = {}
  if (!fs.existsSync(envPath)) {
    return result
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue
    }
    const idx = line.indexOf('=')
    if (idx === -1) {
      continue
    }
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    result[key] = value
  }

  return result
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  const sortedKeys = Object.keys(value).sort()
  const obj = {}
  for (const key of sortedKeys) {
    obj[key] = canonicalize(value[key])
  }
  return obj
}

function canonicalizeAndStringify(value) {
  return JSON.stringify(canonicalize(value))
}

function buildEnv() {
  const envPath = path.join(__dirname, '.env')
  const fileEnv = loadDotEnv(envPath)
  const get = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback

  return {
    GRAPHQL_ENDPOINT: get('GRAPHQL_ENDPOINT', 'http://localhost:3011/graphql'),
    ADMIN_API_SECRET: get('ADMIN_API_SECRET', 'secret-key'),
    ADMIN_SIGNATURE_VERSION: get('ADMIN_SIGNATURE_VERSION', '1'),
    OPERATOR_TENANT_ID: get(
      'OPERATOR_TENANT_ID',
      'f829c064-762a-4430-ac5d-7af5df198551'
    ),
    AUTH_IDENTITY_SERVER_SECRET: get(
      'AUTH_IDENTITY_SERVER_SECRET',
      'auth-secret-key-12345'
    ),
    IDP_CONSENT_URL: get(
      'IDP_CONSENT_URL',
      'http://wallet-frontend:4003/grant-interactions'
    )
  }
}

function signRequest({ query, variables, operationName }, env, timestamp) {
  const payload = `${timestamp}.${canonicalizeAndStringify({
    variables: variables ?? {},
    operationName,
    query
  })}`
  const hmac = crypto.createHmac('sha256', env.ADMIN_API_SECRET)
  hmac.update(payload)
  const digest = hmac.digest('hex')
  return `t=${timestamp}, v${env.ADMIN_SIGNATURE_VERSION}=${digest}`
}

async function graphqlRequest({ query, variables, operationName }, env) {
  const timestamp = Date.now()
  const signature = signRequest(
    { query, variables, operationName },
    env,
    timestamp
  )
  const body = JSON.stringify({ query, variables, operationName })

  const response = await fetch(env.GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      signature,
      'tenant-id': env.OPERATOR_TENANT_ID
    },
    body
  })

  const data = await response.json()
  if (data.errors && data.errors.length) {
    const message = data.errors.map((e) => e.message).join('\n')
    throw new Error(message)
  }
  return data.data
}

// ---- operations -----------------------------------------------------------
const getTenantQuery = /* GraphQL */ `
  query GetTenant($id: String!) {
    tenant(id: $id) {
      id
      publicName
      idpConsentUrl
      idpSecret
    }
  }
`

const createTenantMutation = /* GraphQL */ `
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      tenant {
        id
        publicName
        idpConsentUrl
        idpSecret
      }
    }
  }
`

const updateTenantMutation = /* GraphQL */ `
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) {
      tenant {
        id
        publicName
        idpConsentUrl
        idpSecret
      }
    }
  }
`

const listAssetsQuery = /* GraphQL */ `
  query Assets($first: Int = 100) {
    assets(first: $first) {
      edges {
        node {
          id
          code
          scale
        }
      }
    }
  }
`

const createAssetMutation = /* GraphQL */ `
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      asset {
        id
        code
        scale
      }
    }
  }
`

const getAssetByCodeAndScaleQuery = /* GraphQL */ `
  query AssetByCodeAndScale($code: String!, $scale: UInt8!) {
    assetByCodeAndScale(code: $code, scale: $scale) {
      id
      code
      scale
    }
  }
`

const depositAssetLiquidityMutation = /* GraphQL */ `
  mutation DepositAssetLiquidity($input: DepositAssetLiquidityInput!) {
    depositAssetLiquidity(input: $input) {
      success
    }
  }
`

const assetsToEnsure = [
  { code: 'USD', scale: 2 },
  { code: 'EUR', scale: 2 },
  // { code: 'GBP', scale: 2 },
  // { code: 'ZAR', scale: 2 },
  // { code: 'MXN', scale: 2 },
  // { code: 'SGD', scale: 2 },
  // { code: 'CAD', scale: 2 },
  // { code: 'EGG', scale: 2 },
  // { code: 'PEB', scale: 2 },
  // { code: 'PKR', scale: 2 }
]

async function ensureTenant(env) {
  try {
    const existing = await graphqlRequest(
      { query: getTenantQuery, variables: { id: env.OPERATOR_TENANT_ID } },
      env
    )
    if (existing?.tenant) {
      console.log(
        `Tenant already present: ${existing.tenant.id} (consent URL ${existing.tenant.idpConsentUrl})`
      )
      if (!existing.tenant.idpConsentUrl || !existing.tenant.idpSecret) {
        console.log('Updating tenant idp fields...')
        await graphqlRequest(
          {
            query: updateTenantMutation,
            variables: {
              input: {
                id: env.OPERATOR_TENANT_ID,
                idpConsentUrl: env.IDP_CONSENT_URL,
                idpSecret: env.AUTH_IDENTITY_SERVER_SECRET
              }
            }
          },
          env
        )
        console.log('Tenant idp fields updated')
      }
      return
    }
  } catch (err) {
    // continue and try to create
    console.log('Tenant lookup failed, attempting to create...', err.message)
  }

  console.log('Creating tenant...')
  try {
    const created = await graphqlRequest(
      {
        query: createTenantMutation,
        variables: {
          input: {
            id: env.OPERATOR_TENANT_ID,
            publicName: 'Testnet Wallet',
            apiSecret: env.ADMIN_API_SECRET,
            idpSecret: env.AUTH_IDENTITY_SERVER_SECRET,
            idpConsentUrl: env.IDP_CONSENT_URL
          }
        }
      },
      env
    )
    console.log('Tenant created:', created.createTenant.tenant)
  } catch (err) {
    if (
      typeof err.message === 'string' &&
      err.message.toLowerCase().includes('duplicate')
    ) {
      console.log('Tenant already exists (duplicate key), continuing...')
      return
    }
    throw err
  }
}

async function ensureAssets(env) {
  let current = { assets: { edges: [] } }
  try {
    current = await graphqlRequest(
      { query: listAssetsQuery, variables: { first: 200 } },
      env
    )
  } catch (err) {
    console.log(
      'Asset list failed, continuing to create assets...',
      err.message
    )
  }

  const existingAssets = new Set(
    (current?.assets?.edges ?? []).map((e) => `${e.node.code}:${e.node.scale}`)
  )

  for (const asset of assetsToEnsure) {
    if (existingAssets.has(`${asset.code}:${asset.scale}`)) {
      console.log(`Asset ${asset.code} (scale ${asset.scale}) already exists`)
      continue
    }
    console.log(`Creating asset ${asset.code}...`)
    try {
      await graphqlRequest(
        {
          query: createAssetMutation,
          variables: {
            input: {
              code: asset.code,
              scale: asset.scale
            }
          }
        },
        env
      )
      console.log(`Asset ${asset.code} created`)
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`Asset ${asset.code} already exists (api), continuing...`)
        continue
      }
      throw err
    }
  }
}

// Deposit liquidity for all assets (100000 units per asset, converted to minor units by scale)
async function ensureLiquidity(env) {
  console.log('Ensuring asset liquidity...')

  for (const asset of assetsToEnsure) {
    let node
    try {
      const res = await graphqlRequest(
        {
          query: getAssetByCodeAndScaleQuery,
          variables: { code: asset.code, scale: asset.scale }
        },
        env
      )
      node = res?.assetByCodeAndScale
    } catch (err) {
      console.log(`Lookup failed for ${asset.code}:`, err.message)
      continue
    }

    if (!node?.id) {
      console.log(`Skipping liquidity for ${asset.code}: asset id not found`)
      continue
    }

    // Amount in minor units: 100000 * 10^scale
    const amount = BigInt(100000) * BigInt(10) ** BigInt(node.scale)

    console.log(
      `Depositing liquidity for ${asset.code}: ${amount.toString()} (scale ${node.scale})`
    )
    try {
      const res = await graphqlRequest(
        {
          query: depositAssetLiquidityMutation,
          variables: {
            input: {
              id: crypto.randomUUID(),
              assetId: node.id,
              amount: amount.toString(),
              idempotencyKey: crypto.randomUUID()
            }
          }
        },
        env
      )

      if (!res?.depositAssetLiquidity?.success) {
        console.log(`Liquidity deposit failed for ${asset.code}`)
      } else {
        console.log(`Liquidity deposited for ${asset.code}`)
      }
    } catch (err) {
      console.log(`Liquidity deposit error for ${asset.code}:`, err.message)
    }
  }
}

// ---- main -----------------------------------------------------------------
;(async function main() {
  const env = buildEnv()
  console.log('Rafiki admin endpoint:', env.GRAPHQL_ENDPOINT)
  await ensureTenant(env)
  await ensureAssets(env)
  await ensureLiquidity(env)
  console.log('✅ Rafiki configuration complete')
})().catch((err) => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
