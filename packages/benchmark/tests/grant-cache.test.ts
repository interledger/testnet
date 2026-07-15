import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readGrantCache, writeGrantCache, upsertGrant } from '@/grant-cache'

describe('grant cache', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bench-grants-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns an empty cache when the file is missing', async () => {
    expect(await readGrantCache(join(dir, 'nope.json'))).toEqual({})
  })

  it('round-trips a cache to disk (creating parent dirs)', async () => {
    const path = join(dir, 'nested', 'grants.json')
    const data = {
      'https://wallet/alice': { accessToken: 'a', manageUrl: 'm' }
    }
    await writeGrantCache(path, data)
    expect(await readGrantCache(path)).toEqual(data)
  })

  it('returns an empty cache for invalid JSON', async () => {
    const path = join(dir, 'bad.json')
    writeFileSync(path, '{ not json')
    expect(await readGrantCache(path)).toEqual({})
  })

  it('returns an empty cache when the JSON is not an object', async () => {
    const path = join(dir, 'arr.json')
    writeFileSync(path, '[1,2,3]')
    expect(await readGrantCache(path)).toEqual({})
  })

  it('upsertGrant adds without mutating the original', () => {
    const original = { 'https://wallet/a': { accessToken: 'x' } }
    const next = upsertGrant(original, 'https://wallet/b', {
      accessToken: 'y'
    })
    expect(next['https://wallet/b'].accessToken).toBe('y')
    expect(next['https://wallet/a'].accessToken).toBe('x')
    expect(
      original['https://wallet/b' as keyof typeof original]
    ).toBeUndefined()
  })

  it('upsertGrant overwrites an existing payer', () => {
    const original = { p: { accessToken: 'old' } }
    const next = upsertGrant(original, 'p', { accessToken: 'new' })
    expect(next.p.accessToken).toBe('new')
  })
})
