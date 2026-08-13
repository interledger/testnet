import {
  getFrontendOrigins,
  isCookieDomainUsableFrom,
  normalizeHost
} from '@/utils/hosts'

describe('Host Helper Functions', (): void => {
  describe('normalizeHost', (): void => {
    it('should strip protocol, trailing slashes and whitespace', (): void => {
      expect(normalizeHost('https://interledger.cards')).toBe(
        'interledger.cards'
      )
      expect(normalizeHost('http://interledger.cards/')).toBe(
        'interledger.cards'
      )
      expect(normalizeHost('  interledger.cards  ')).toBe('interledger.cards')
    })

    it('should leave an already bare host untouched', (): void => {
      expect(normalizeHost('interledger.cards')).toBe('interledger.cards')
    })
  })

  describe('getFrontendOrigins', (): void => {
    it('should allow both the bare domain and the wallet subdomain', (): void => {
      const origins = getFrontendOrigins('interledger.cards')

      expect(origins).toContain('https://interledger.cards')
      expect(origins).toContain('https://wallet.interledger.cards')
    })

    // Regression: socket.io omitted the wallet subdomain while HTTP CORS
    // allowed it, so real-time events were rejected from the only origin the
    // frontend is served on.
    it('should be usable for both CORS and socket.io without drift', (): void => {
      expect(getFrontendOrigins('interledger.cards')).toEqual(
        getFrontendOrigins('https://interledger.cards/')
      )
    })
  })

  describe('isCookieDomainUsableFrom', (): void => {
    it('should accept a cookie domain that is an ancestor of the request host', (): void => {
      // Production: backend on api.interledger.cards issuing the apex domain.
      expect(
        isCookieDomainUsableFrom('api.interledger.cards', 'interledger.cards')
      ).toBe(true)

      // Sandbox: backend sits under the frontend host.
      expect(
        isCookieDomainUsableFrom(
          'api.wallet.interledger-test.dev',
          'wallet.interledger-test.dev'
        )
      ).toBe(true)
    })

    it('should accept a cookie domain equal to the request host', (): void => {
      expect(
        isCookieDomainUsableFrom('interledger.cards', 'interledger.cards')
      ).toBe(true)
    })

    // Regression: production served the API from api.interledger.cards while
    // issuing Domain=wallet.interledger.cards. Browsers discarded the cookie
    // silently and no one could stay logged in.
    it('should reject a cookie domain that is a sibling of the request host', (): void => {
      expect(
        isCookieDomainUsableFrom(
          'api.interledger.cards',
          'wallet.interledger.cards'
        )
      ).toBe(false)
    })

    it('should reject a cookie domain that is a descendant of the request host', (): void => {
      expect(
        isCookieDomainUsableFrom('interledger.cards', 'api.interledger.cards')
      ).toBe(false)
    })

    it('should ignore ports, casing and a leading dot', (): void => {
      expect(
        isCookieDomainUsableFrom(
          'API.Interledger.Cards:4003',
          '.interledger.cards'
        )
      ).toBe(true)
    })

    it('should not treat a partial suffix match as an ancestor', (): void => {
      // "notinterledger.cards" must not be considered a child of
      // "interledger.cards" just because the string ends with it.
      expect(
        isCookieDomainUsableFrom('notinterledger.cards', 'interledger.cards')
      ).toBe(false)
    })

    it('should reject empty values', (): void => {
      expect(isCookieDomainUsableFrom('', 'interledger.cards')).toBe(false)
      expect(isCookieDomainUsableFrom('api.interledger.cards', '')).toBe(false)
    })
  })
})
