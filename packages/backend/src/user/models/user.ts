import bcryptjs from 'bcryptjs'
import { Secret, sign } from 'jsonwebtoken'
import { Model } from 'objection'

export class User extends Model {
  static tableName = 'users'

  id!: number
  email!: string
  password!: string
  username!: string

  async $beforeInsert() {
    this.password = await bcryptjs.hash(this.password, 10)
  }

  generateJWT() {
    return sign(
      { userId: this.id },
      process.env.JWT_ACCESS_TOKEN_SECRET as Secret,
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
      }
    )
  }

  generateRefreshToken() {
    return sign(
      { userId: this.id },
      process.env.JWT_REFRESH_TOKEN_SECRET as Secret,
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME
      }
    )
  }

  async verifyPassword(password: string) {
    return bcryptjs.compare(password, this.password)
  }
}
