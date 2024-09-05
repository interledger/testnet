import { z } from 'zod'

export const terminateCardSchema = z.object({
  reason: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable()
})

interface CardService {}
const createCardService = (): CardService => ({})

const cardService = createCardService()
export { cardService }
