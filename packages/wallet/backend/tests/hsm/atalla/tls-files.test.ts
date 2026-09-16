import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { readTlsFile, validateTlsFile } from '@/hsm/atalla/tls-files'

const CERT = `-----BEGIN CERTIFICATE-----\nMIIBdummy\n-----END CERTIFICATE-----\n`

describe('Atalla TLS files', () => {
  let dir: string

  beforeEach((): void => {
    dir = mkdtempSync(join(tmpdir(), 'atalla-tls-'))
  })

  afterEach((): void => {
    rmSync(dir, { recursive: true, force: true })
  })

  const write = (name: string, contents: string | Buffer): string => {
    const path = join(dir, name)
    writeFileSync(path, contents)
    return path
  }

  describe('validateTlsFile', (): void => {
    it('accepts a readable PEM file', (): void => {
      expect(validateTlsFile(write('ca.crt', CERT))).toBeNull()
    })

    it('accepts a private key, not only a certificate', (): void => {
      const key =
        '-----BEGIN PRIVATE KEY-----\nMIIkey\n-----END PRIVATE KEY-----\n'
      expect(validateTlsFile(write('client.key', key))).toBeNull()
    })

    it('reports a path that does not exist', (): void => {
      const path = join(dir, 'absent.crt')
      expect(validateTlsFile(path)).toBe(`file does not exist (${path})`)
    })

    it('reports a directory', (): void => {
      const path = join(dir, 'certs')
      mkdirSync(path)
      expect(validateTlsFile(path)).toBe(`path is not a regular file (${path})`)
    })

    it('reports an empty file', (): void => {
      const path = write('empty.crt', '')
      expect(validateTlsFile(path)).toBe(`file is empty (${path})`)
    })

    it('reports a file that is not PEM', (): void => {
      const path = write('der.crt', Buffer.from([0x30, 0x82, 0x01, 0x0a]))
      expect(validateTlsFile(path)).toBe(
        `file is not PEM: no "-----BEGIN" line found (${path})`
      )
    })

    it('resolves a relative path against the working directory', (): void => {
      const problem = validateTlsFile('does-not-exist.crt')
      expect(problem).toBe(
        `file does not exist (${resolve('does-not-exist.crt')})`
      )
    })
  })

  describe('readTlsFile', (): void => {
    it('returns the file bytes untouched', (): void => {
      const path = write('ca.crt', CERT)
      const contents = readTlsFile('ATALLA_CA_CERT_PATH', path)

      expect(Buffer.isBuffer(contents)).toBe(true)
      expect(contents.toString()).toBe(CERT)
    })

    it('preserves real newlines rather than escaped ones', (): void => {
      const contents = readTlsFile('ATALLA_CA_CERT_PATH', write('ca.crt', CERT))

      expect(contents.toString()).toContain('\n')
      expect(contents.toString()).not.toContain('\\n')
    })

    it('throws a message naming the variable behind the path', (): void => {
      const path = join(dir, 'absent.crt')

      expect((): Buffer => readTlsFile('ATALLA_CLIENT_KEY_PATH', path)).toThrow(
        `ATALLA_CLIENT_KEY_PATH: file does not exist (${path})`
      )
    })
  })
})
