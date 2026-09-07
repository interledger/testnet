import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { AdminNotificationService } from '@/admin-notification/service'
import { EmailService } from '@/email/service'
import { UserService } from '@/user/service'
import { createUser } from '@/tests/helpers'
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

  const args = mockLogInRequest().body

  beforeAll(async () => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    userService = await bindings.resolve('userService')
    adminNotificationService = new AdminNotificationService(
      mockEmailService as unknown as EmailService,
      userService,
      { info: jest.fn(), error: jest.fn() } as never
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
      email: 'user@example.com',
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
      sent: 0,
      failed: 2,
      total: 2,
      failedRecipients: ['user1@example.com', 'user2@example.com']
    })
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
    const emailService = new EmailService({ ...env, SEND_EMAIL: false }, {
      info: jest.fn(),
      error: jest.fn()
    } as never)

    const result = await emailService.sendAnnouncementBatch(
      ['a@example.com', 'b@example.com'],
      'Subject',
      '<p>Body</p>'
    )

    expect(result).toEqual({ sent: 2, failed: 0, failedRecipients: [] })
    expect(mockedSendgrid.send).not.toHaveBeenCalled()
  })
})
