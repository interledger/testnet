import { Env } from '@/config/env'
import { default as sendgrid } from '@sendgrid/mail'
import { getForgotPasswordEmail } from '@/email/templates/forgotPassword'
import { Logger } from 'winston'
import { getVerifyEmail } from '@/email/templates/verifyEmail'

interface EmailArgs {
  to: string
  subject: string
  html: string
}

interface IEmailService {
  sendForgotPassword(to: string, token: string): Promise<void>
}
interface EmailServiceDependencies {
  env: Env
  logger: Logger
}

export class EmailService implements IEmailService {
  private readonly baseUrl: string
  private readonly from: { email: string; name: string }

  constructor(private deps: EmailServiceDependencies) {
    sendgrid.setApiKey(this.deps.env.SENDGRID_API_KEY)

    const host = this.deps.env.RAFIKI_MONEY_FRONTEND_HOST
    this.baseUrl =
      host === 'localhost' ? 'http://localhost:4003' : `https://${host}`

    this.from = {
      email: this.deps.env.FROM_EMAIL,
      name: 'Tech Interledger'
    }
  }

  private async send(email: EmailArgs): Promise<void> {
    await sendgrid.send({ from: this.from, ...email })
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/reset/${token}`

    if (this.deps.env.SEND_EMAIL) {
      return this.send({
        to,
        subject: '[Rafiki.Money] Reset your password',
        html: getForgotPasswordEmail(url)
      })
    }

    this.deps.logger.info(
      `Send email is disabled. Reset password link is: ${url}`
    )
  }

  async sendVerifyEmail(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/verify/${token}`

    if (this.deps.env.SEND_EMAIL) {
      return this.send({
        to,
        subject: '[Rafiki.Money] Verify your account',
        html: getVerifyEmail(url)
      })
    }

    this.deps.logger.info(
      `Send email is disabled. Verify email link is: ${url}`
    )
  }
}
