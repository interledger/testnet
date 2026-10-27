import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readConfig, type Env } from '../src/config'

const CONFIG = '/etc/hsm-adapter/config/config.yaml'
const env: Env = { HSM_ADAPTER_CONFIG_PATH: CONFIG }

const minimal = `
atalla:
  host: atalla-hsm
  port: 13506
`

// A file system of path -> content. Reading any other path fails.
function files(entries: Record<string, string>) {
  return (path: string): string => {
    const content = entries[path]
    if (content === undefined) throw new Error(`ENOENT: ${path}`)
    return content
  }
}

test('defaults: plaintext, one connection, the role port', () => {
  const read = files({ [CONFIG]: minimal })

  const issuer = readConfig('issuer', env, read)
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

  assert.equal(readConfig('merchant', env, read).grpc.port, 50052)
})

test('every setting comes from the file', () => {
  const read = files({
    [CONFIG]: `
log:
  level: debug
grpc:
  host: 127.0.0.1
  port: 6000
atalla:
  host: 10.0.0.1
  port: 13506
  timeout_ms: 500
start_timeout_ms: 1000
stop_timeout_ms: 2000
`
  })

  const config = readConfig('merchant', env, read)
  assert.deepEqual(config.grpc, { host: '127.0.0.1', port: 6000 })
  assert.equal(config.hsm.host, '10.0.0.1')
  assert.equal(config.hsm.timeoutMs, 500)
  assert.equal(config.logLevel, 'debug')
  assert.equal(config.startTimeoutMs, 1000)
  assert.equal(config.stopTimeoutMs, 2000)
})

test('ignores the old environment variables', () => {
  const config = readConfig(
    'issuer',
    { ...env, ATALLA_HOST: 'from-env', GRPC_PORT: '7000', LOG_LEVEL: 'trace' },
    files({ [CONFIG]: minimal })
  )
  assert.equal(config.hsm.host, 'atalla-hsm')
  assert.equal(config.grpc.port, 50051)
  assert.equal(config.logLevel, 'info')
})

test('TLS reads the three files from the default paths', () => {
  const read = files({
    [CONFIG]: `${minimal}  tls:\n    enabled: true\n`,
    '/etc/atalla/tls/ca.crt': 'ca-pem',
    '/etc/atalla/tls/client.crt': 'cert-pem',
    '/etc/atalla/tls/client.key': 'key-pem'
  })

  assert.deepEqual(readConfig('issuer', env, read).hsm.tls, {
    ca: 'ca-pem',
    cert: 'cert-pem',
    key: 'key-pem',
    skipServerIdentityCheck: false
  })
})

test('TLS paths may be absolute or relative to the config file', () => {
  const read = files({
    [CONFIG]: `${minimal}  tls:
    enabled: true
    ca_cert_path: /a/ca.crt
    client_cert_path: tls/client.crt
    client_key_path: ../client.key
    skip_server_identity_check: true
`,
    '/a/ca.crt': 'ca-pem',
    '/etc/hsm-adapter/config/tls/client.crt': 'cert-pem',
    '/etc/hsm-adapter/client.key': 'key-pem'
  })

  assert.deepEqual(readConfig('issuer', env, read).hsm.tls, {
    ca: 'ca-pem',
    cert: 'cert-pem',
    key: 'key-pem',
    skipServerIdentityCheck: true
  })
})

test('TLS names the file it cannot read', () => {
  const read = files({ [CONFIG]: `${minimal}  tls:\n    enabled: true\n` })
  assert.throws(
    () => readConfig('issuer', env, read),
    /atalla\.tls\.ca_cert_path: cannot read \/etc\/atalla\/tls\/ca\.crt/
  )
})

test('TLS off reads no files', () => {
  const read = files({ [CONFIG]: `${minimal}  tls:\n    enabled: false\n` })
  assert.equal(readConfig('issuer', env, read).hsm.tls, false)
})

test('requires the path variable and a readable, parsable file', () => {
  assert.throws(
    () => readConfig('issuer', {}, files({})),
    /HSM_ADAPTER_CONFIG_PATH must be set to the path of a YAML config file/
  )
  assert.throws(
    () => readConfig('issuer', env, files({})),
    /cannot read \/etc\/hsm-adapter\/config\/config\.yaml/
  )
  assert.throws(
    () => readConfig('issuer', env, files({ [CONFIG]: 'atalla: [' })),
    /cannot parse \/etc\/hsm-adapter\/config\/config\.yaml/
  )
})

test('rejects bad values and names the key', () => {
  const cases: [string, RegExp][] = [
    ['', /atalla: Required/],
    ['atalla:\n  port: 13506\n', /atalla\.host: Required/],
    ['atalla:\n  host: h\n', /atalla\.port: Required/],
    ['atalla:\n  host: h\n  port: 0\n', /atalla\.port: Number must be/],
    ["atalla:\n  host: h\n  port: '13506'\n", /atalla\.port: Expected number/],
    [`${minimal}grpc:\n  port: x\n`, /grpc\.port: Expected number/],
    [`${minimal}  timeout_ms: -1\n`, /atalla\.timeout_ms: Number must be/],
    [
      `${minimal}  tls:\n    enabled: yes\n`,
      /atalla\.tls\.enabled: Expected boolean/
    ]
  ]
  for (const [content, message] of cases) {
    assert.throws(
      () => readConfig('issuer', env, files({ [CONFIG]: content })),
      message
    )
  }
})

test('rejects unknown keys, so a typo fails the start', () => {
  assert.throws(
    () =>
      readConfig(
        'issuer',
        env,
        files({ [CONFIG]: `${minimal}  timeoutMs: 500\n` })
      ),
    /atalla: Unrecognized key\(s\) in object: 'timeoutMs'/
  )
})
