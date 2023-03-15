import { Router } from 'express'
import passport from 'passport'
import { PricesController } from './prices/prices.controller'
import { PricesService } from './prices/prices.service'
import { QuoteController } from './quote/quote.controller'
import { QuoteService } from './quote/quote.service'
import { WebHookService } from './webhook/webhook.service'
import { WebHookController } from './webhook/webhook.controller'

export const rafikiIntegrationRouter = Router()

const pricesService = new PricesService()
const pricesController = new PricesController(pricesService)

const quoteService = new QuoteService()
const quoteController = new QuoteController(quoteService)

const webHookService = new WebHookService()
const webHookController = new WebHookController(webHookService)

rafikiIntegrationRouter.get(
  'prices',
  passport.authenticate('jwt', { session: false }),
  pricesController.getPrices
)

rafikiIntegrationRouter.post(
  'quote',
  passport.authenticate('jwt', { session: false }),
  quoteController.createQuote
)

rafikiIntegrationRouter.post(
  'webhooks',
  passport.authenticate('jwt', { session: false }),
  webHookController.onWebHook
)
