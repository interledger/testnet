import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { Redis } from 'ioredis'

const redis = new Redis()

export class RefreshToken {
  id!: string
  token!: string
  userId!: string

  constructor(userId: string) {
    this.id = uuidv4()
    this.userId = userId
    this.token = jwt.sign({ id: this.id }, process.env.JWT_SECRET!)
  }

  static async verify(token: string) {
    const { id } = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    const data = await redis.get(`refresh_token:${id}`)

    if (!data) {
      throw new Error('Refresh token is invalid or has expired')
    }

    return id
  }

  static async getUserId(token: string): Promise<string | null> {
    return redis.get(`refresh_token:${token}`)
  }

  async save() {
    await redis.set(
      `refresh_token:${this.id}`,
      this.userId,
      'ex',
      60 * 60 * 24 * 7
    )
  }
}
