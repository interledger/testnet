import { Env } from '@/config/env'
import { default as sendgrid } from '@sendgrid/mail'
import { getForgotPasswordEmail } from '@/email/templates/forgotPassword'

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
}

export class EmailService implements IEmailService {
  private readonly from: string
  private readonly baseUrl: string
  constructor(private deps: EmailServiceDependencies) {
    sendgrid.setApiKey(this.deps.env.SENDGRID_API_KEY)
    this.from = this.deps.env.FROM_EMAIL
    const host = this.deps.env.RAFIKI_MONEY_FRONTEND_HOST
    this.baseUrl =
      host === 'localhost' ? 'http://localhost:4003' : `https://${host}`
  }

  private async send(email: EmailArgs): Promise<void> {
    await sendgrid.send(email)
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    return this.send({
      from: this.from,
      to,
      subject: '[Rafiki.Money] Reset your password',
      html: getForgotPasswordEmail(this.baseUrl, token)
    })
  }
}
