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
  send(args: EmailArgs): Promise<void>
  sendForgotPassword(to: string, token: string): Promise<void>
}
interface EmailServiceDependencies {
  env: Env
}

export class EmailService implements IEmailService {
  private readonly from: string
  private readonly host: string
  constructor(private deps: EmailServiceDependencies) {
    sendgrid.setApiKey(this.deps.env.SENDGRID_API_KEY)
    this.from = this.deps.env.FROM_EMAIL
    this.host = this.deps.env.RAFIKI_MONEY_FRONTEND_HOST
  }

  async send(email: EmailArgs): Promise<void> {
    await sendgrid.send(email)
  }

  async sendForgotPassword(to: string, token: string): Promise<void> {
    return this.send({
      from: this.from,
      to,
      subject: 'rafiki.money - password recovery',
      html: getForgotPasswordEmail(this.host, token)
    })
  }
}
