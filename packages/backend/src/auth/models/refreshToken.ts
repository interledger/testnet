/* eslint-disable @typescript-eslint/no-non-null-assertion */
import jwt from 'jsonwebtoken'
import { Model } from 'objection'
import env from '../../config/env'
import { User } from '../../user/models/user'

export class RefreshToken extends Model {
  static tableName = 'refreshTokens'

  id!: string
  token!: string
  userId!: string
  expiresAt!: Date

  constructor(token = '', userId = '', expiresIn = 0) {
    super()
    this.token = token
    this.expiresAt = new Date(Date.now() + expiresIn ?? 0 * 1000)
    this.userId = userId
  }

  static async verify(token: string): Promise<RefreshToken> {
    const { userId } = jwt.verify(token, env.JWT_REFRESH_TOKEN_SECRET!) as {
      userId: string
    }

    const rt: RefreshToken | undefined =
      await RefreshToken.query<RefreshToken>()
        .where({ userId: userId, token })
        .andWhere('expiresAt', '>', new Date())
        .first()

    if (!rt) {
      throw new Error('Refresh token is invalid or has expired')
    }

    return rt
  }

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'refresh_tokens.userId',
        to: 'users.id'
      }
    }
  })
}
