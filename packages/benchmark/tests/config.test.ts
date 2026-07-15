import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseConfig, resolvePrivateKey, loadConfig } from '@/config'

const validScenario = {
  amount: 1000000,
  amountScale: 2,
  paymentSize: 100,
  fromWalletAddress: 'https://wallet.example/alice',
  toWalletAddress: 'https://wallet.example/bob',
  workers: 10
}

const validConfig = {
  client: {
    walletAddressUrl: 'https://wallet.example/benchmark',
    keyId: 'key-1',
    privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----'
  },
  payments: [validScenario]
}

const PEM = '-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----\n'

describe('parseConfig', () => {
  it('accepts a valid config', () => {
    const config = parseConfig(validConfig)
    expect(config.payments).toHaveLength(1)
    expect(config.payments[0].workers).toBe(10)
  })

  it('rejects a missing client', () => {
    expect(() => parseConfig({ payments: [validScenario] })).toThrow(
      /Invalid benchmark config/
    )
  })

  it('rejects an empty payments list', () => {
    expect(() => parseConfig({ ...validConfig, payments: [] })).toThrow()
  })

  it('rejects amount not divisible by paymentSize', () => {
    expect(() =>
      parseConfig({
        ...validConfig,
        payments: [{ ...validScenario, amount: 1000001 }]
      })
    ).toThrow(/exact multiple/)
  })

  it('rejects paymentSize larger than amount', () => {
    expect(() =>
      parseConfig({
        ...validConfig,
        payments: [{ ...validScenario, amount: 100, paymentSize: 1000 }]
      })
    ).toThrow()
  })

  it('rejects identical from/to wallet addresses', () => {
    expect(() =>
      parseConfig({
        ...validConfig,
        payments: [
          { ...validScenario, toWalletAddress: validScenario.fromWalletAddress }
        ]
      })
    ).toThrow(/must differ/)
  })

  it('rejects non-integer amounts and bad urls', () => {
    expect(() =>
      parseConfig({
        ...validConfig,
        payments: [{ ...validScenario, amount: 10.5 }]
      })
    ).toThrow()
    expect(() =>
      parseConfig({
        ...validConfig,
        payments: [{ ...validScenario, fromWalletAddress: 'not-a-url' }]
      })
    ).toThrow()
  })

  it('accepts an optional pre-approved access token', () => {
    const config = parseConfig({
      ...validConfig,
      payments: [
        { ...validScenario, accessToken: 'tok', manageUrl: 'https://manage' }
      ]
    })
    expect(config.payments[0].accessToken).toBe('tok')
  })
})

describe('resolvePrivateKey', () => {
  let dir: string
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'bench-key-'))
  })
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns inline PEM unchanged', () => {
    expect(resolvePrivateKey(PEM, dir)).toBe(PEM)
  })

  it('reads a PEM file by relative path', () => {
    writeFileSync(join(dir, 'k.key'), PEM)
    expect(resolvePrivateKey('k.key', dir)).toBe(PEM)
  })

  it('reads a PEM file by absolute path', () => {
    const abs = join(dir, 'abs.key')
    writeFileSync(abs, PEM)
    expect(resolvePrivateKey(abs, dir)).toBe(PEM)
  })

  it('throws when the file is not a PEM key', () => {
    writeFileSync(join(dir, 'bad.key'), 'not a key')
    expect(() => resolvePrivateKey('bad.key', dir)).toThrow(/PEM private key/)
  })
})

describe('loadConfig', () => {
  let dir: string
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'bench-cfg-'))
  })
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('loads YAML and resolves the private key from a sibling file', () => {
    writeFileSync(join(dir, 'bench.key'), PEM)
    const yaml = `
client:
  walletAddressUrl: https://wallet.example/benchmark
  keyId: key-1
  privateKey: bench.key
payments:
  - amount: 1000000
    amountScale: 2
    paymentSize: 100
    fromWalletAddress: https://wallet.example/alice
    toWalletAddress: https://wallet.example/bob
    workers: 5
`
    const cfgPath = join(dir, 'bench.yaml')
    writeFileSync(cfgPath, yaml)
    const config = loadConfig(cfgPath)
    expect(config.client.privateKey).toBe(PEM)
    expect(config.payments[0].workers).toBe(5)
  })
})
