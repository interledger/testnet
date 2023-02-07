import bcryptjs from 'bcryptjs'
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

  async verifyPassword(password: string) {
    return bcryptjs.compare(password, this.password)
  }
}
