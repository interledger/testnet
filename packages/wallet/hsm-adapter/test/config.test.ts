import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readConfig, type Env } from '../src/config'

const base: Env = { ATALLA_HOST: 'atalla-hsm', ATALLA_PORT: '13506' }

const noFiles = (path: string): string => {
  throw new Error(`unexpected read of ${path}`)
}

test('defaults: plaintext, one connection, the role port', () => {
  const issuer = readConfig('issuer', base, noFiles)
  assert.deepEqual(issuer.grpc, { host: '0.0.0.0', port: 50051 })
  assert.deepEqual(issuer.hsm, {
    host: 'atalla-hsm',
    port: 13506,
    timeoutMs: 2000,
    poolSize: 1,
    tls: false
  })
  assert.equal(issuer.logLevel, 'info')
  assert.equal(issuer.startTimeoutMs, 15000)
  assert.equal(issuer.stopTimeoutMs, 10000)

  assert.equal(readConfig('merchant', base, noFiles).grpc.port, 50052)
})

test('overrides', () => {
  const config = readConfig(
    'merchant',
    {
      ...base,
      GRPC_HOST: '127.0.0.1',
      GRPC_PORT: '6000',
      ATALLA_TIMEOUT_MS: '500',
      LOG_LEVEL: 'debug',
      START_TIMEOUT_MS: '1000',
      STOP_TIMEOUT_MS: '2000'
    },
    noFiles
  )
  assert.deepEqual(config.grpc, { host: '127.0.0.1', port: 6000 })
  assert.equal(config.hsm.timeoutMs, 500)
  assert.equal(config.logLevel, 'debug')
  assert.equal(config.startTimeoutMs, 1000)
  assert.equal(config.stopTimeoutMs, 2000)
})

test('TLS reads the three files, from the default paths or the named ones', () => {
  const read = (path: string): string => `pem:${path}`

  const defaults = readConfig(
    'issuer',
    { ...base, ATALLA_TLS_ENABLED: 'true' },
    read
  )
  assert.deepEqual(defaults.hsm.tls, {
    ca: 'pem:/etc/atalla/tls/ca.crt',
    cert: 'pem:/etc/atalla/tls/client.crt',
    key: 'pem:/etc/atalla/tls/client.key',
    skipServerIdentityCheck: false
  })

  const named = readConfig(
    'issuer',
    {
      ...base,
      ATALLA_TLS_ENABLED: 'true',
      ATALLA_CA_CERT_PATH: '/a',
      ATALLA_CLIENT_CERT_PATH: '/b',
      ATALLA_CLIENT_KEY_PATH: '/c',
      ATALLA_SKIP_SERVER_IDENTITY_CHECK: 'true'
    },
    read
  )
  assert.deepEqual(named.hsm.tls, {
    ca: 'pem:/a',
    cert: 'pem:/b',
    key: 'pem:/c',
    skipServerIdentityCheck: true
  })
})

test('TLS names the file it cannot read', () => {
  assert.throws(
    () =>
      readConfig('issuer', { ...base, ATALLA_TLS_ENABLED: 'true' }, noFiles),
    /ATALLA_CA_CERT_PATH: cannot read \/etc\/atalla\/tls\/ca.crt/
  )
})

test('ATALLA_TLS_ENABLED=false is plaintext', () => {
  assert.equal(
    readConfig('issuer', { ...base, ATALLA_TLS_ENABLED: 'false' }, noFiles).hsm
      .tls,
    false
  )
})

test('rejects bad values', () => {
  const cases: [Env, RegExp][] = [
    [{ ATALLA_PORT: '13506' }, /ATALLA_HOST is required/],
    [{ ATALLA_HOST: 'h' }, /ATALLA_PORT is required/],
    [{ ...base, ATALLA_PORT: '0' }, /ATALLA_PORT must be an integer/],
    [{ ...base, GRPC_PORT: 'x' }, /GRPC_PORT must be an integer/],
    [
      { ...base, ATALLA_TIMEOUT_MS: '-1' },
      /ATALLA_TIMEOUT_MS must be a positive number/
    ],
    [
      { ...base, ATALLA_TLS_ENABLED: 'yes' },
      /ATALLA_TLS_ENABLED must be true or false/
    ]
  ]
  for (const [env, message] of cases) {
    assert.throws(() => readConfig('issuer', env, noFiles), message)
  }
})
