import { z } from 'zod'

export const MAX_BODY_HTML_LENGTH = 50000

const sendNotificationBody = z
  .object({
    subject: z.string().min(1).max(200),
    bodyHtml: z.string().min(1).max(MAX_BODY_HTML_LENGTH),
    sendToAll: z.boolean().optional(),
    recipients: z.array(z.string().email()).optional(),
    dryRun: z.boolean().optional(),
    idempotencyKey: z.string().min(1).max(200).optional()
  })
  .refine(
    (data) => {
      if (data.sendToAll === true) {
        return data.recipients === undefined
      }

      return Array.isArray(data.recipients) && data.recipients.length > 0
    },
    {
      message:
        'Provide either sendToAll: true or a non-empty recipients list, not both'
    }
  )

export const sendNotificationBodySchema = z.object({
  body: sendNotificationBody
})

export type SendNotificationBody = z.infer<typeof sendNotificationBody>
