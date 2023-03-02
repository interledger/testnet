import { Model } from 'objection'

export class Wallet extends Model {
  static tableName = 'wallets'

  id!: string
}
