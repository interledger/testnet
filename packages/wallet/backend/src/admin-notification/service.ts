import { BadRequest, Cache, Conflict, RedisClient } from '@shared/backend'
import { EmailService } from '@/email/service'
import { UserService } from '@/user/service'
import { Logger } from 'winston'
import { SendNotificationBody } from '@/admin-notification/validation'

const MAX_EXPLICIT_RECIPIENTS = 500
const IDEMPOTENCY_TTL_HOURS = 24
const IDEMPOTENCY_TTL_SECONDS = IDEMPOTENCY_TTL_HOURS * 60 * 60

export interface SendNotificationResult {
  dryRun: boolean
  sent: number
  failed: number
  total: number
  recipients?: string[]
  failedRecipients: string[]
}

export class AdminNotificationService {
  private idempotencyCache: Cache<true>

  constructor(
    private emailService: EmailService,
    private userService: UserService,
    private logger: Logger,
    redisClient: RedisClient
  ) {
    this.idempotencyCache = new Cache<true>(
      redisClient,
      'AdminNotificationIdempotency'
    )
  }

  public async sendNotification(
    input: SendNotificationBody
  ): Promise<SendNotificationResult> {
    const isDryRun = input.dryRun === true

    if (!isDryRun && input.idempotencyKey) {
      const alreadyUsed = await this.idempotencyCache.get(input.idempotencyKey)
      if (alreadyUsed) {
        throw new Conflict(
          `Idempotency key ${input.idempotencyKey} was already used in the last ${IDEMPOTENCY_TTL_HOURS} hours`
        )
      }
    }

    const recipients = await this.resolveRecipients(input)

    if (recipients.length === 0) {
      throw new BadRequest('No recipients found')
    }

    if (isDryRun) {
      return {
        dryRun: true,
        total: recipients.length,
        recipients,
        sent: 0,
        failed: 0,
        failedRecipients: []
      }
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

    const result: SendNotificationResult = {
      dryRun: false,
      sent,
      failed,
      total: recipients.length,
      failedRecipients
    }

    if (input.idempotencyKey) {
      await this.idempotencyCache.set(input.idempotencyKey, true, {
        expiry: IDEMPOTENCY_TTL_SECONDS
      })
    }

    return result
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
