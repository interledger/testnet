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

export const getCardLimitsSchema = z.object({
  params: z.object({
    cardId: z.string()
  })
})

export const createOrOverrideCardLimitsSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  body: z.array(
    z.object({
      type: z.enum([
        'perTransaction',
        'dailyOverall',
        'weeklyOverall',
        'monthlyOverall',
        'dailyAtm',
        'dailyEcomm',
        'monthlyOpenScheme',
        'nonEUPayments'
      ]),
      limit: z
        .number()
        .positive()
        .transform((val) => val.toString()),
      currency: z.string().length(3),
      isDisabled: z.boolean().optional().default(false)
    })
  )
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

export const getCardTransactionsSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  query: z.object({
    pageSize: z.coerce.number().int().positive().optional(),
    pageNumber: z.coerce.number().int().nonnegative().optional()
  })
})

export const getTokenForPinChange = z.object({
  params: z.object({
    cardId: z.string()
  })
})

export const changePinSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  body: z.object({
    token: z.string(),
    cypher: z.string()
  })
})

export const permanentlyBlockCardSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  query: z.object({
    reasonCode: z.enum([
      'LostCard',
      'StolenCard',
      'IssuerRequestGeneral',
      'IssuerRequestFraud',
      'IssuerRequestLegal',
      'IssuerRequestIncorrectOpening',
      'CardDamagedOrNotWorking',
      'UserRequest',
      'IssuerRequestCustomerDeceased',
      'ProductDoesNotRenew'
    ])
  })
})
