import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { AdminNotificationService } from '@/admin-notification/service'
import { EmailService } from '@/email/service'
import { UserService } from '@/user/service'
import { createFakeRedisClient, createUser } from '@/tests/helpers'
import { mockLogInRequest } from '@/tests/mocks'
import sendgrid from '@sendgrid/mail'

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}))

describe('Admin Notification Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let adminNotificationService: AdminNotificationService
  let userService: UserService

  const mockEmailService = {
    sendAnnouncementBatch: jest.fn()
  }

  const mockLogger = { info: jest.fn(), error: jest.fn() }

  const args = mockLogInRequest().body

  beforeAll(async () => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    userService = await bindings.resolve('userService')
  })

  // Rebuilt per test so idempotency reservations do not leak between them.
  beforeEach(() => {
    adminNotificationService = new AdminNotificationService(
      mockEmailService as unknown as EmailService,
      userService,
      mockLogger as never,
      createFakeRedisClient()
    )
  })

  afterEach(async () => {
    await truncateTables(knex)
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await appContainer.stop()
    await knex.destroy()
  })

  it('returns verified user emails only', async () => {
    await createUser({
      ...args,
      email: 'verified@example.com',
      isEmailVerified: true
    })
    await createUser({
      ...args,
      email: 'unverified@example.com',
      isEmailVerified: false
    })

    const emails = await userService.getVerifiedUserEmails()

    expect(emails).toEqual(['verified@example.com'])
  })

  it('deduplicates explicit recipients case-insensitively', async () => {
    await createUser({
      ...args,
      email: 'User@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    const result = await adminNotificationService.sendNotification({
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['User@example.com', 'user@example.com']
    })

    expect(mockEmailService.sendAnnouncementBatch).toHaveBeenCalledWith(
      ['user@example.com'],
      'Test',
      '<p>Test</p>'
    )
    expect(result).toEqual({
      dryRun: false,
      sent: 1,
      failed: 0,
      total: 1,
      failedRecipients: []
    })
  })

  it('rejects recipients that are not registered users', async () => {
    await createUser({
      ...args,
      email: 'known@example.com',
      isEmailVerified: true
    })

    await expect(
      adminNotificationService.sendNotification({
        subject: 'Test',
        bodyHtml: '<p>Test</p>',
        recipients: ['known@example.com', 'unknown@example.com']
      })
    ).rejects.toMatchObject({
      message: 'One or more recipients are not registered users'
    })
    expect(mockEmailService.sendAnnouncementBatch).not.toHaveBeenCalled()
  })

  it('returns failed recipients when all sends fail', async () => {
    await createUser({
      ...args,
      email: 'user1@example.com',
      isEmailVerified: true
    })
    await createUser({
      ...args,
      email: 'user2@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 0,
      failed: 2,
      failedRecipients: ['user1@example.com', 'user2@example.com']
    })

    const result = await adminNotificationService.sendNotification({
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['user1@example.com', 'user2@example.com']
    })

    expect(result).toEqual({
      dryRun: false,
      sent: 0,
      failed: 2,
      total: 2,
      failedRecipients: ['user1@example.com', 'user2@example.com']
    })
  })

  it('resolves recipients without sending when dryRun is true', async () => {
    await createUser({
      ...args,
      email: 'dryrun@example.com',
      isEmailVerified: true
    })

    const result = await adminNotificationService.sendNotification({
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['dryrun@example.com'],
      dryRun: true
    })

    expect(mockEmailService.sendAnnouncementBatch).not.toHaveBeenCalled()
    expect(result).toEqual({
      dryRun: true,
      total: 1,
      recipients: ['dryrun@example.com'],
      sent: 0,
      failed: 0,
      failedRecipients: []
    })
  })

  it('rejects a repeated idempotency key instead of resending', async () => {
    await createUser({
      ...args,
      email: 'idempotent@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    const input = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['idempotent@example.com'],
      idempotencyKey: 'repeat-key'
    }

    await adminNotificationService.sendNotification(input)

    await expect(
      adminNotificationService.sendNotification(input)
    ).rejects.toMatchObject({
      message:
        'Idempotency key repeat-key was already used in the last 24 hours'
    })
    expect(mockEmailService.sendAnnouncementBatch).toHaveBeenCalledTimes(1)
  })

  it('rejects a concurrent request that shares an idempotency key', async () => {
    await createUser({
      ...args,
      email: 'concurrent@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    const input = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['concurrent@example.com'],
      idempotencyKey: 'concurrent-key'
    }

    const results = await Promise.allSettled([
      adminNotificationService.sendNotification(input),
      adminNotificationService.sendNotification(input)
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      message:
        'Idempotency key concurrent-key was already used in the last 24 hours'
    })
    expect(mockEmailService.sendAnnouncementBatch).toHaveBeenCalledTimes(1)
  })

  it('releases the idempotency key when the send throws', async () => {
    await createUser({
      ...args,
      email: 'throws@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockRejectedValueOnce(
      new Error('SendGrid is unavailable')
    )

    const input = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['throws@example.com'],
      idempotencyKey: 'released-on-throw'
    }

    await expect(
      adminNotificationService.sendNotification(input)
    ).rejects.toThrow('SendGrid is unavailable')

    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    await expect(
      adminNotificationService.sendNotification(input)
    ).resolves.toMatchObject({ sent: 1 })
  })

  it('releases the idempotency key when every send fails', async () => {
    await createUser({
      ...args,
      email: 'allfail@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValueOnce({
      sent: 0,
      failed: 1,
      failedRecipients: ['allfail@example.com']
    })

    const input = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['allfail@example.com'],
      idempotencyKey: 'released-on-total-failure'
    }

    await expect(
      adminNotificationService.sendNotification(input)
    ).resolves.toMatchObject({ sent: 0, failed: 1 })

    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    await expect(
      adminNotificationService.sendNotification(input)
    ).resolves.toMatchObject({ sent: 1 })
  })

  it('does not consume the idempotency key when recipients are invalid', async () => {
    await createUser({
      ...args,
      email: 'valid@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    await expect(
      adminNotificationService.sendNotification({
        subject: 'Test',
        bodyHtml: '<p>Test</p>',
        recipients: ['valid@example.com', 'unknown@example.com'],
        idempotencyKey: 'unused-after-validation-error'
      })
    ).rejects.toMatchObject({
      message: 'One or more recipients are not registered users'
    })

    await expect(
      adminNotificationService.sendNotification({
        subject: 'Test',
        bodyHtml: '<p>Test</p>',
        recipients: ['valid@example.com'],
        idempotencyKey: 'unused-after-validation-error'
      })
    ).resolves.toMatchObject({ sent: 1 })
  })

  it('logs a total failure at error level rather than as a sent notification', async () => {
    await createUser({
      ...args,
      email: 'logfail@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 0,
      failed: 1,
      failedRecipients: ['logfail@example.com']
    })

    await adminNotificationService.sendNotification({
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['logfail@example.com']
    })

    expect(mockLogger.info).not.toHaveBeenCalledWith(
      'Admin notification sent',
      expect.anything()
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Admin notification failed for every recipient',
      expect.objectContaining({ sent: 0, failed: 1 })
    )
  })

  it('logs a successful send at info level', async () => {
    await createUser({
      ...args,
      email: 'logsent@example.com',
      isEmailVerified: true
    })
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 1,
      failed: 0,
      failedRecipients: []
    })

    await adminNotificationService.sendNotification({
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['logsent@example.com']
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Admin notification sent',
      expect.objectContaining({ sent: 1, failed: 0, mode: 'list' })
    )
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('rejects explicit recipient lists over 500 addresses', async () => {
    const recipients = Array.from(
      { length: 501 },
      (_, index) => `user${index}@example.com`
    )

    await expect(
      adminNotificationService.sendNotification({
        subject: 'Test',
        bodyHtml: '<p>Test</p>',
        recipients
      })
    ).rejects.toMatchObject({
      message: 'Recipients list exceeds maximum of 500'
    })
  })
})

describe('EmailService sendAnnouncementBatch', () => {
  const mockedSendgrid = sendgrid as jest.Mocked<typeof sendgrid>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends each chunk in one SendGrid request using personalizations', async () => {
    mockedSendgrid.send.mockResolvedValueOnce([{ statusCode: 202 }] as never)

    const emailService = new EmailService(
      { ...env, SEND_EMAIL: true, SENDGRID_API_KEY: 'test-key' },
      { info: jest.fn(), error: jest.fn() } as never
    )

    const result = await emailService.sendAnnouncementBatch(
      ['a@example.com', 'b@example.com', 'c@example.com'],
      'Subject',
      '<p>Body</p>'
    )

    expect(result).toEqual({
      sent: 3,
      failed: 0,
      failedRecipients: []
    })
    expect(mockedSendgrid.send).toHaveBeenCalledTimes(1)
    expect(mockedSendgrid.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Test.Wallet] Subject',
        personalizations: [
          { to: [{ email: 'a@example.com' }] },
          { to: [{ email: 'b@example.com' }] },
          { to: [{ email: 'c@example.com' }] }
        ]
      })
    )
  })

  it('falls back to individual sends when a batch fails', async () => {
    mockedSendgrid.send
      .mockRejectedValueOnce(new Error('Batch failed'))
      .mockResolvedValueOnce([{ statusCode: 202 }] as never)
      .mockRejectedValueOnce(new Error('Individual failed'))
      .mockResolvedValueOnce([{ statusCode: 202 }] as never)

    const emailService = new EmailService(
      { ...env, SEND_EMAIL: true, SENDGRID_API_KEY: 'test-key' },
      { info: jest.fn(), error: jest.fn() } as never
    )

    const result = await emailService.sendAnnouncementBatch(
      ['a@example.com', 'b@example.com', 'c@example.com'],
      'Subject',
      '<p>Body</p>'
    )

    expect(result).toEqual({
      sent: 2,
      failed: 1,
      failedRecipients: ['b@example.com']
    })
    expect(mockedSendgrid.send).toHaveBeenCalledTimes(4)
  })

  it('returns all sent when SEND_EMAIL is disabled', async () => {
    const info = jest.fn()
    const emailService = new EmailService({ ...env, SEND_EMAIL: false }, {
      info,
      error: jest.fn()
    } as never)

    const result = await emailService.sendAnnouncementBatch(
      ['a@example.com', 'b@example.com'],
      'Subject',
      '<p>Body</p>'
    )

    expect(result).toEqual({ sent: 2, failed: 0, failedRecipients: [] })
    expect(mockedSendgrid.send).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith(
      'Send email is disabled. Would send announcement "Subject" to 2 recipients'
    )
    expect(JSON.stringify(info.mock.calls)).not.toContain('a@example.com')
  })
})
