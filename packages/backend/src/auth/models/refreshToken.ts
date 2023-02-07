/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Redis } from 'ioredis'
import jwt from 'jsonwebtoken'

const redis = new Redis({
  port: Number(process.env.REDIS_PORT!),
  host: process.env.REDIS_HOST
})

export class RefreshToken {
  id!: string
  token!: string

  constructor(userId: number, token: string) {
    this.id = `refresh_token:${userId}`
    this.token = token
  }

  static async verify(token: string): Promise<number> {
    const { userId } = jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN_SECRET!
    ) as { userId: number }

    const data = await redis.get(`refresh_token:${userId}`)

    if (!data) {
      throw new Error('Refresh token is invalid or has expired')
    }

    return Number(userId)
  }

  async save() {
    await redis.set(
      this.id,
      this.token,
      'EX',
      process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME!
    )
  }
}
