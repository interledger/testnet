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
      await this.assertIdempotencyKeyUnused(input.idempotencyKey)
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

    const idempotencyKey = input.idempotencyKey
    if (idempotencyKey) {
      await this.reserveIdempotencyKey(idempotencyKey)
    }

    let batch: Awaited<ReturnType<EmailService['sendAnnouncementBatch']>>

    try {
      batch = await this.emailService.sendAnnouncementBatch(
        recipients,
        input.subject,
        input.bodyHtml
      )
    } catch (error) {
      await this.releaseIdempotencyKey(idempotencyKey)
      throw error
    }

    const { sent, failed, failedRecipients } = batch

    const outcome = {
      subject: input.subject,
      total: recipients.length,
      sent,
      failed,
      mode: input.sendToAll === true ? 'all' : 'list'
    }

    if (sent === 0) {
      await this.releaseIdempotencyKey(idempotencyKey)
      this.logger.error(
        'Admin notification failed for every recipient',
        outcome
      )
    } else {
      this.logger.info('Admin notification sent', outcome)
    }

    return {
      dryRun: false,
      sent,
      failed,
      total: recipients.length,
      failedRecipients
    }
  }

  // Fast path, so a replay skips resolveRecipients. Not authoritative:
  // reserveIdempotencyKey is what decides.
  private async assertIdempotencyKeyUnused(key: string): Promise<void> {
    if (await this.idempotencyCache.get(key)) {
      throw this.duplicateIdempotencyKey(key)
    }
  }

  private async reserveIdempotencyKey(key: string): Promise<void> {
    const reserved = await this.idempotencyCache.setIfNotExists(key, true, {
      expiry: IDEMPOTENCY_TTL_SECONDS
    })

    if (!reserved) {
      throw this.duplicateIdempotencyKey(key)
    }
  }

  private duplicateIdempotencyKey(key: string): Conflict {
    return new Conflict(
      `Idempotency key ${key} was already used in the last ${IDEMPOTENCY_TTL_HOURS} hours`
    )
  }

  // Never throws: every caller is already on a failure path.
  private async releaseIdempotencyKey(key: string | undefined): Promise<void> {
    if (!key) {
      return
    }

    try {
      await this.idempotencyCache.delete(key)
    } catch (error) {
      this.logger.error(
        'Failed to release idempotency key after a failed announcement',
        { idempotencyKey: key, error }
      )
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
