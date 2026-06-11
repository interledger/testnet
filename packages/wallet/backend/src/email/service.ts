import { Env } from '@/config/env'
import { default as sendgrid, MailDataRequired } from '@sendgrid/mail'
import { getForgotPasswordEmailTemplate } from '@/email/templates/forgotPassword'
import { Logger } from 'winston'
import { getVerifyEmailTemplate } from '@/email/templates/verifyEmail'
import dns from 'dns'
import domains from 'disposable-email-domains'
import { BadRequest } from '@shared/backend'
import { getRejectEmailTemplate } from '@/email/templates/rejectEmail'
import { getActionRequiredEmailTemplate } from './templates/actionRequiredEmail'
import { getKYCVerificationEmailTemplate } from './templates/kycVerifiedEmail'
import nodemailer from 'nodemailer'

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
  private imageSrc: string =
    'https://raw.githubusercontent.com/interledger/testnet/main/packages/wallet/backend/src/email/templates/images/InterledgerTestWallet.png'
  private subjectPrefix: string = 'Test.Wallet'
  private appName: string = 'Interledger Test Wallet'
  private smtpTransport: ReturnType<typeof nodemailer.createTransport> | null =
    null

  constructor(
    private env: Env,
    private logger: Logger
  ) {
    if (this.env.SMTP_HOST) {
      this.smtpTransport = nodemailer.createTransport({
        host: this.env.SMTP_HOST,
        port: this.env.SMTP_PORT ?? 1025,
        secure: true,
        tls: {
          // Only skip cert validation for loopback hosts (local mailslurper uses a self-signed cert).
          rejectUnauthorized:
            this.env.SMTP_HOST !== 'localhost' &&
            !this.env.SMTP_HOST?.startsWith('127.')
        }
      })
    } else if (this.env.SEND_EMAIL) {
      sendgrid.setApiKey(this.env.SENDGRID_API_KEY)
    }

    const host = this.env.RAFIKI_MONEY_FRONTEND_HOST
    this.baseUrl =
      host === 'localhost' ? 'http://localhost:4003' : `https://${host}`

    this.from = {
      email: this.env.FROM_EMAIL,
      name: 'Tech Interledger'
    }

    if (this.env.GATEHUB_ENV === 'production') {
      this.imageSrc =
        'https://raw.githubusercontent.com/interledger/testnet/main/packages/wallet/backend/src/email/templates/images/InterledgerWallet.png'
      this.subjectPrefix = 'Interledger Cards'
      this.appName = 'Interledger Cards'
    }
  }

  private async send(email: EmailArgs): Promise<void> {
    if (this.smtpTransport) {
      await this.smtpTransport.sendMail({
        from: typeof this.from === 'string' ? this.from : this.from.email,
        ...email
      })
      return
    }
    await sendgrid.send({ from: this.from, ...email })
  }

  private shouldSend(): boolean {
    return this.env.SEND_EMAIL || this.smtpTransport !== null
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/reset/${token}`

    if (this.shouldSend()) {
      return this.send({
        to,
        subject: `[${this.subjectPrefix}] Reset your password`,
        html: getForgotPasswordEmailTemplate(url, this.imageSrc)
      })
    }

    this.logger.info(`Send email is disabled. Reset password link is: ${url}`)
  }

  async sendVerifyEmail(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/verify/${token}`

    if (this.shouldSend()) {
      return this.send({
        to,
        subject: `[${this.subjectPrefix}] Verify your account`,
        html: getVerifyEmailTemplate(url, this.imageSrc, this.appName)
      })
    }

    this.logger.info(`Send email is disabled. Verify email link is: ${url}`)
  }

  async sendUserRejectedEmail(to: string, textHtml: string): Promise<void> {
    if (this.shouldSend()) {
      return this.send({
        to,
        subject: `[${this.subjectPrefix}] Account rejected`,
        html: getRejectEmailTemplate(textHtml, this.imageSrc)
      })
    }

    this.logger.info(`Send email is disabled. Reject user email was not sent`)
  }

  async sendActionRequiredEmail(to: string, textHtml: string): Promise<void> {
    if (this.shouldSend()) {
      return this.send({
        to,
        subject: `[${this.subjectPrefix}] Action required`,
        html: getActionRequiredEmailTemplate(textHtml, this.imageSrc)
      })
    }

    this.logger.info(
      `Send email is disabled. Action required email was not sent`
    )
  }

  async sendKYCVerifiedEmail(to: string): Promise<void> {
    if (this.shouldSend()) {
      const loginUrl = `${this.baseUrl}/auth/login`
      return this.send({
        to,
        subject: `[${this.subjectPrefix}] You are verified`,
        html: getKYCVerificationEmailTemplate(
          loginUrl,
          this.imageSrc,
          this.appName
        )
      })
    }

    this.logger.info(`Send email is disabled. KYC verified email was not sent`)
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
