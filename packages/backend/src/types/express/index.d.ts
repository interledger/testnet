/* eslint-disable no-var */
export {}

import { type Knex } from 'knex'

declare global {
  var __TESTING_KNEX__: Knex

  namespace Express {
    interface User {
      id: string
      email: string
    }
    export interface Request {
      user?: User
    }
  }
}
