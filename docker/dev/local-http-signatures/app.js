const Koa = require('koa')
const Router = require('koa-router')

const logger = require('koa-logger')
const json = require('koa-json')
const bodyParser = require('koa-bodyparser')

const {
  parseOrProvisionKey,
  createHeaders
} = require('@interledger/http-signature-utils')

const port = process.env.PORT ?? 3000
const app = new Koa()
const router = new Router()

// Load key
const privateKey = parseOrProvisionKey(
  process.env.KEY_FILE ?? '../temp/private-key.pem'
)

router.post('/', async (ctx) => {
  const validateBody = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestBody
  ) =>
    !!requestBody.keyId &&
    !!requestBody.request.headers &&
    !!requestBody.request.method &&
    !!requestBody.request.url

  if (!validateBody(ctx.request.body)) {
    ctx.status = 400
    return
  }

  const { keyId, request } = ctx.request.body

  const headers = await createHeaders({ request, privateKey, keyId })
  delete headers['Content-Length']
  delete headers['Content-Type']

  ctx.body = headers
})

// Middlewares
app.use(json())
app.use(logger())
app.use(bodyParser())

// Routes
app.use(router.routes()).use(router.allowedMethods())

app.listen(port, () => {
  console.log(`HTTP Signature Manager started on port ${port}`)
})
