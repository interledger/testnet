/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('transactions', function (table) {
    table.bigint('txAmount').nullable()
    table.string('txCurrency').nullable()
    table.string('conversionRate').nullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('transactions', function (table) {
    table.dropColumn('txAmount')
    table.dropColumn('txCurrency')
    table.dropColumn('conversionRate')
  })
}
