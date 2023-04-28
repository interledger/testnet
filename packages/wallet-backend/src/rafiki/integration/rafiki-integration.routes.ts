import { Router } from 'express'
import { RatesController } from './rates/rates.controller'
import { RatesService } from './rates/rates.service'
import { QuoteController } from './quote/quote.controller'
import { QuoteService } from './quote/quote.service'
import { WebHookService } from './webhook/webhook.service'
import { WebHookController } from './webhook/webhook.controller'

export const rafikiIntegrationRouter = Router()

const ratesService = new RatesService()
const ratesController = new RatesController(ratesService)

const quoteService = new QuoteService()
const quoteController = new QuoteController(quoteService)

const webHookService = new WebHookService()
const webHookController = new WebHookController(webHookService)

rafikiIntegrationRouter.get('/rates', ratesController.getRates)

rafikiIntegrationRouter.post('/quote', quoteController.createQuote)

rafikiIntegrationRouter.post('/webhooks', webHookController.onWebHook)
