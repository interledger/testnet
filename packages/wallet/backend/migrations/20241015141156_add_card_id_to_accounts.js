/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table('walletAddresses', function (table) {
      table.dropColumn('cardId')
    })
    .then(() => {
      return knex.schema.table('accounts', function (table) {
        table.string('cardId').unique().nullable()
      })
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table('accounts', function (table) {
      table.dropColumn('cardId')
    })
    .then(() => {
      return knex.schema.table('walletAddresses', function (table) {
        table.string('cardId').unique().nullable()
      })
    })
}
