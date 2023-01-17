import express, {
  Application,
  NextFunction,
  Request,
  Response,
  Router
} from "express"

const app: Application = express()
const router: Router = Router()
const PORT = 3000

app.disable("X-Powered-By")
app.use(express.json())

interface CustomResponse {
  message: string
}

router.get(
  "/",
  async (_req: Request, res: Response<CustomResponse>, _next: NextFunction) => {
    res.json({ message: "🐈" })
  }
)

app.use(router)

app.listen(PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${PORT}`)
})
