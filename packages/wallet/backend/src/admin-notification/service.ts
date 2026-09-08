import { BadRequest } from '@shared/backend'
import { EmailService } from '@/email/service'
import { UserService } from '@/user/service'
import { Logger } from 'winston'
import { SendNotificationBody } from '@/admin-notification/validation'

const MAX_EXPLICIT_RECIPIENTS = 500

export interface SendNotificationResult {
  sent: number
  failed: number
  total: number
  failedRecipients: string[]
}

export class AdminNotificationService {
  constructor(
    private emailService: EmailService,
    private userService: UserService,
    private logger: Logger
  ) {}

  public async sendNotification(
    input: SendNotificationBody
  ): Promise<SendNotificationResult> {
    const recipients = await this.resolveRecipients(input)

    if (recipients.length === 0) {
      throw new BadRequest('No recipients found')
    }

    const { sent, failed, failedRecipients } =
      await this.emailService.sendAnnouncementBatch(
        recipients,
        input.subject,
        input.bodyHtml
      )

    const mode = input.sendToAll === true ? 'all' : 'list'

    this.logger.info('Admin notification sent', {
      subject: input.subject,
      total: recipients.length,
      sent,
      failed,
      mode
    })

    return {
      sent,
      failed,
      total: recipients.length,
      failedRecipients
    }
  }

  private async resolveRecipients(
    input: SendNotificationBody
  ): Promise<string[]> {
    if (input.sendToAll === true) {
      return this.userService.getVerifiedUserEmails()
    }

    const uniqueRecipients = [
      ...new Set((input.recipients ?? []).map((email) => email.toLowerCase()))
    ]

    if (uniqueRecipients.length > MAX_EXPLICIT_RECIPIENTS) {
      throw new BadRequest(
        `Recipients list exceeds maximum of ${MAX_EXPLICIT_RECIPIENTS}`
      )
    }

    const users = await this.userService.getByEmails(uniqueRecipients)
    const foundEmails = new Set(users.map((user) => user.email.toLowerCase()))
    const unknownEmails = uniqueRecipients.filter(
      (email) => !foundEmails.has(email)
    )

    if (unknownEmails.length > 0) {
      throw new BadRequest('One or more recipients are not registered users', {
        recipients: unknownEmails.join(', ')
      })
    }

    return uniqueRecipients
  }
}
