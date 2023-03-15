/* eslint-disable no-var */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
import { type Knex } from 'knex'

declare global {
  var __TESTING_KNEX__: Knex
  // var __TESTING_POSTGRES_CONTAINER__: any
}
