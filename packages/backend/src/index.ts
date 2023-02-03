import express, { Application, Router } from 'express'

import * as dotenv from 'dotenv'
dotenv.config()

const app: Application = express()
const router: Router = Router()

app.disable('X-Powered-By')
app.use(express.json())

interface CustomResponse {
  message: string
}

// router.get(
//   '/',
//   async (_req: Request, res: Response<CustomResponse>, _next: NextFunction) => {
//     res.json({ message: '🐈' })
//   }
// )

app.use(router)

// app.use(errorHandler)

app.listen(process.env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${process.env.PORT}`)
})
