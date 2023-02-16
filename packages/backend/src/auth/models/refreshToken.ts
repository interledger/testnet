/* eslint-disable @typescript-eslint/no-non-null-assertion */
import jwt from 'jsonwebtoken'
import knex from 'knex'
import { Model } from 'objection'
import { User } from '../../user/models/user'

export class RefreshToken extends Model {
  static tableName = 'refresh_tokens'

  id!: number
  token!: string
  userId!: string
  expiresAt!: string

  static async verify(token: string): Promise<RefreshToken> {
    const { userId } = jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN_SECRET!
    ) as { userId: string }

    //TODO: change from directly checking if the refresh token is in the database,
    //TODO to somehow store md5 sums of refresh tokens
    //TODO: and verify the hashes instead of an exact string match of tokens

    const rt: RefreshToken | undefined = await knex('refresh_tokens')
      .where({ user_id: userId, token })
      .andWhere('expires_at', '>', new Date())
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
