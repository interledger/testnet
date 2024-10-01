import { z } from 'zod'

export const getCardsByCustomerSchema = z.object({
  params: z.object({
    customerId: z.string()
  })
})

export const getCardDetailsSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  query: z.object({
    publicKeyBase64: z.string()
  })
})

export const lockCardSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  query: z.object({
    reasonCode: z.enum([
      'ClientRequestedLock',
      'LostCard',
      'StolenCard',
      'IssuerRequestGeneral',
      'IssuerRequestFraud',
      'IssuerRequestLegal'
    ])
  }),
  body: z.object({
    note: z.string()
  })
})

export const unlockCardSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  body: z.object({
    note: z.string()
  })
})

export const changePinSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  body: z.object({
    cypher: z.string()
  })
})
