/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table('transactions', (table) => {
      table.enum('source', ['Interledger', 'Stripe', 'Card'])
    })
    .then(() => {
      return knex('transactions')
        .update({ source: 'Card' })
        .where({ isCard: true })
    })
    .then(() => {
      return knex('transactions')
        .update({ source: 'Interledger' })
        .whereNull('source')
    })
    .then(() => {
      return knex.schema.table('transactions', (table) => {
        table.dropColumn('isCard')
      })
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table('transactions', (table) => {
      table.boolean('isCard').defaultTo(false)
    })
    .then(() => {
      return knex('transactions')
        .update({ isCard: true })
        .where({ source: 'Card' })
    })
    .then(() => {
      return knex.schema.table('transactions', (table) => {
        table.dropColumn('source')
      })
    })
}
