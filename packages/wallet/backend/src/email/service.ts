import { Env } from '@/config/env'
import { default as sendgrid, MailDataRequired } from '@sendgrid/mail'
import { getForgotPasswordEmailTemplate } from '@/email/templates/forgotPassword'
import { Logger } from 'winston'
import { getVerifyEmailTemplate } from '@/email/templates/verifyEmail'
import dns from 'dns'
import domains from 'disposable-email-domains'
import { BadRequest } from '@shared/backend'

interface EmailArgs {
  to: string
  subject: string
  html: string
}

const disposableDomains: Set<string> = new Set(domains)

interface IEmailService {
  sendForgotPassword(to: string, token: string): Promise<void>
}

export class EmailService implements IEmailService {
  private readonly baseUrl: string
  private readonly from: MailDataRequired['from']

  constructor(
    private env: Env,
    private logger: Logger
  ) {
    if (this.env.SEND_EMAIL) {
      sendgrid.setApiKey(this.env.SENDGRID_API_KEY)
    }

    const host = this.env.RAFIKI_MONEY_FRONTEND_HOST
    this.baseUrl =
      host === 'localhost' ? 'http://localhost:4003' : `https://${host}`

    this.from = {
      email: this.env.FROM_EMAIL,
      name: 'Tech Interledger'
    }
  }

  private async send(email: EmailArgs): Promise<void> {
    await sendgrid.send({ from: this.from, ...email })
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/reset/${token}`

    if (this.env.SEND_EMAIL) {
      return this.send({
        to,
        subject: '[Test.Wallet] Reset your password',
        html: getForgotPasswordEmailTemplate(url)
      })
    }

    this.logger.info(`Send email is disabled. Reset password link is: ${url}`)
  }

  async sendVerifyEmail(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/verify/${token}`

    if (this.env.SEND_EMAIL) {
      return this.send({
        to,
        subject: '[Test.Wallet] Verify your account',
        html: getVerifyEmailTemplate(url)
      })
    }

    this.logger.info(`Send email is disabled. Verify email link is: ${url}`)
  }

  public async verifyDomain(domain: string): Promise<void> {
    try {
      if (this.isDisposableDomain(domain)) {
        throw new Error('Email was created using a disposable email service')
      }

      await this.canResolveDnsMx(domain).catch((e) => {
        throw new Error(e)
      })
    } catch (e) {
      this.logger.error('Error on validating email domain', e)
      throw new BadRequest('Email address is invalid')
    }
  }

  private isDisposableDomain(domain: string): boolean {
    return disposableDomains.has(domain)
  }

  private async canResolveDnsMx(domain: string): Promise<void> {
    return new Promise((resolve, reject) =>
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses.length) {
          return reject('Domain dns mx cannot be resolved')
        }

        resolve()
      })
    )
  }
}
