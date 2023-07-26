import domains from 'disposable-email-domains'
import dns from 'dns'

export const verifyDomain = (domain: string): Promise<boolean> => {
  if (isDisposableDomain(domain)) {
    throw new Error('Email was created using a disposable email service')
  }

  return canResolveDnsMx(domain)
}

const disposableDomains: Set<string> = new Set(domains)
export const isDisposableDomain = (domain: string): boolean => {
  return disposableDomains.has(domain)
}

export const canResolveDnsMx = async (domain: string): Promise<boolean> => {
  return new Promise((resolve, reject) =>
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses.length)
        return reject('Domain dns mx cannot be resolved')
      resolve(true)
    })
  )
}
