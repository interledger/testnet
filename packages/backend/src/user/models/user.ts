import { Model } from 'objection'

export class User extends Model {
  static tableName = 'users'
  id!: number
  username!: string
  password!: string
}
