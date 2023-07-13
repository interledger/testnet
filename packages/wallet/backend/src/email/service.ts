import { Env } from '@/config/env'
import { default as sendgrid } from '@sendgrid/mail'
import { getForgotPasswordEmail } from '@/email/templates/forgotPassword'
import { Logger } from 'winston'

interface EmailArgs {
  to: string
  from: string
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
  private readonly from: string
  private readonly baseUrl: string
  private readonly isSendEmailEnabled: boolean

  constructor(private deps: EmailServiceDependencies) {
    sendgrid.setApiKey(this.deps.env.SENDGRID_API_KEY)
    this.from = this.deps.env.FROM_EMAIL
    this.isSendEmailEnabled = this.deps.env.SEND_EMAIL

    const host = this.deps.env.RAFIKI_MONEY_FRONTEND_HOST
    this.baseUrl =
      host === 'localhost' ? 'http://localhost:4003' : `https://${host}`
  }

  private async send(email: EmailArgs): Promise<void> {
    await sendgrid.send(email)
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    const url = `${this.baseUrl}/auth/reset/${token}`

    this.isSendEmailEnabled
      ? await this.send({
          from: this.from,
          to,
          subject: '[Rafiki.Money] Reset your password',
          html: getForgotPasswordEmail(url)
        })
      : this.deps.logger.info(
          `Send email is disabled. Reset password link is: ${url}`
        )
  }
}
